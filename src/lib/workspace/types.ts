export type ProjectStatus = "In progress" | "Review" | "Completed" | "On hold";

export interface Place {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  place: Place;
  status: ProjectStatus;
  /** ISO date (yyyy-mm-dd) */
  deadline: string;
  budget: number;
  progress: number;
  createdAt: string;
  /** set when the project came from a pipeline offer */
  fromJobId?: string;
}

export type ActivityKind = "payment" | "comment" | "file" | "task" | "pipeline" | "profile" | "message" | "project";

export interface Activity {
  id: string;
  kind: ActivityKind;
  who: string;
  text: string;
  at: string;
  /** in-app link to the thing that changed */
  link?: string;
}

export type AvatarHue = "butter" | "cobalt" | "mint" | "coral" | "lilac";

export interface Profile {
  name: string;
  email: string;
  role: string;
  location: string;
  bio: string;
  hue: AvatarHue;
  notifyEmail: boolean;
  notifyDigest: boolean;
  workStart: number;
  workEnd: number;
}

export interface MonthValue {
  month: string;
  value: number;
}

export interface Workspace {
  version: 2;
  profile: Profile;
  projects: Project[];
  activity: Activity[];
  lastReadAt: string;
  extraCities: Place[];
  earnings: MonthValue[];
}

export const STATUS_ORDER: readonly ProjectStatus[] = ["In progress", "Review", "On hold", "Completed"];
