import useSWR from "swr";
import type {
  BannerSlide,
  InitiativeConfig,
  ValidatorEntry,
  MissionConfig,
  WorkshopTopic,
  TestimonialsConfig,
  SupportEntry,
} from "@/lib/models/landingPageConfig";

export interface LandingConfig {
  banner: { slides: BannerSlide[] };
  initiative: InitiativeConfig;
  validators: { items: ValidatorEntry[] };
  mission: MissionConfig;
  workshopTopics: { items: WorkshopTopic[] };
  testimonials: TestimonialsConfig;
  support: { items: SupportEntry[] };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLandingConfig() {
  const { data, error, isLoading } = useSWR<LandingConfig>(
    "/api/public/landing",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  return { config: data ?? null, isLoading, isError: !!error };
}
