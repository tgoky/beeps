import { UserRole } from "@prisma/client";

export const BASE_PROFILE_FIELDS = ["fullName", "bio", "location", "website", "avatar", "coverImage"] as const;

type FieldType = "text" | "textarea" | "tags";

export const ROLE_PROFILE_FIELDS: Partial<
  Record<UserRole, { model: string; fields: { key: string; label: string; type: FieldType }[] }>
> = {
  PRODUCER: {
    model: "producerProfile",
    fields: [
      { key: "genres", label: "Genres", type: "tags" },
      { key: "specialties", label: "Specialties", type: "tags" },
      { key: "equipment", label: "Equipment", type: "tags" },
      { key: "experience", label: "Experience", type: "text" },
      { key: "productionRate", label: "Production Rate", type: "text" },
      { key: "songwritingRate", label: "Songwriting Rate", type: "text" },
      { key: "mixingRate", label: "Mixing Rate", type: "text" },
      { key: "availability", label: "Availability", type: "text" },
    ],
  },
  ARTIST: {
    model: "artistProfile",
    fields: [
      { key: "genres", label: "Genres", type: "tags" },
      { key: "skills", label: "Skills", type: "tags" },
    ],
  },
  LYRICIST: {
    model: "lyricistProfile",
    fields: [
      { key: "genres", label: "Genres", type: "tags" },
      { key: "writingStyle", label: "Writing Style", type: "text" },
      { key: "collaborationStyle", label: "Collaboration Style", type: "text" },
      { key: "portfolio", label: "Portfolio Link", type: "text" },
    ],
  },
  GEAR_SALES: {
    model: "gearSalesProfile",
    fields: [
      { key: "businessName", label: "Business Name", type: "text" },
      { key: "specialties", label: "Specialties", type: "tags" },
      { key: "inventory", label: "Inventory Notes", type: "textarea" },
    ],
  },
  STUDIO_OWNER: {
    model: "studioOwnerProfile",
    fields: [
      { key: "studioName", label: "Studio Name", type: "text" },
      { key: "capacity", label: "Capacity", type: "text" },
      { key: "equipment", label: "Equipment", type: "tags" },
      { key: "hourlyRate", label: "Default Hourly Rate", type: "text" },
    ],
  },
};