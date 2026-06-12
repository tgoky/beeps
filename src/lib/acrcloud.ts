import crypto from "crypto";

const ACR_HOST = process.env.ACR_HOST || "identify-eu-west-1.acrcloud.com";
const ACR_ACCESS_KEY = process.env.ACR_ACCESS_KEY!;
const ACR_ACCESS_SECRET = process.env.ACR_ACCESS_SECRET!;

function buildSignature(method: string, uri: string, timestamp: string) {
  const signatureVersion = "1";
  const stringToSign = [method, uri, ACR_ACCESS_KEY, signatureVersion, timestamp].join('\n');
  return crypto.createHmac('sha1', ACR_ACCESS_SECRET)
               .update(Buffer.from(stringToSign, 'utf-8'))
               .digest().toString('base64');
}

/**
 * Gate 1: Scans the audio URL against ACRCloud's 150M+ song database
 * to detect stolen major-label samples.
 */
export async function identifyAudio(audioUrl: string) {
  const endpoint = "/v1/identify";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = buildSignature("POST", endpoint, timestamp);

  const form = new FormData();
  form.append("sample", audioUrl);
  form.append("access_key", ACR_ACCESS_KEY);
  form.append("data_type", "audio");
  form.append("signature_version", "1");
  form.append("signature", signature);
  form.append("sample_bytes", "0"); 
  form.append("timestamp", timestamp);

  try {
    const res = await fetch(`https://${ACR_HOST}${endpoint}`, {
      method: "POST",
      body: form as any,
    });
    
    const data = await res.json();
    
    // Status Code 0 means ACRCloud found a copyright match!
    if (data.status.code === 0 && data.metadata?.music?.length > 0) {
      const match = data.metadata.music[0];
      return { 
        isMatch: true, 
        matchData: `${match.title} by ${match.artists?.[0]?.name}` 
      };
    }
    return { isMatch: false, matchData: null };
  } catch (error) {
    console.error("ACRCloud Identify Error:", error);
    return { isMatch: false, error };
  }
}