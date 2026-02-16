import { EventsFilterBar } from "@/components/sections/event/eventFilter";
import { EventsGrid } from "@/components/sections/event/eventGrid";
import { EventsHeader } from "@/components/sections/event/eventHeader";
import { EventsTabs } from "@/components/sections/event/eventTabs";
import { FeaturedEvent } from "@/components/sections/event/featuredEvent";
import { cn } from "@/lib/utils";



export default function EventPage() {

    return (
        <main className={cn('flex', 'flex-col', 'p-5', 'pt-[90px]', 'items-center', 'justify-center', 'w-full', 'h-full')}>
            <EventsHeader />
            <EventsFilterBar />
            <FeaturedEvent />
            <EventsTabs />
            <EventsGrid />
        </main>
    )
}