import { NewsletterOrCTA } from "@/components/sections/events/eventCTA";
import { EventsFilterBar } from "@/components/sections/events/eventFilter";
import { EventsGrid } from "@/components/sections/events/eventGrid";
import { EventsHeader } from "@/components/sections/events/eventHeader";
import { EventsTabs } from "@/components/sections/events/eventTabs";
import { FeaturedEvent } from "@/components/sections/events/featuredEvent";
import { cn } from "@/lib/utils";



export default function EventPage() {

    return (
        <main className={cn('flex', 'flex-col', 'p-5', 'pt-[90px]', 'items-center', 'justify-center', 'w-full', 'h-full')}>
            <EventsHeader />
            <EventsFilterBar />
            <FeaturedEvent />
            <EventsTabs />
            <EventsGrid />
            <NewsletterOrCTA />
        </main>
    )
}