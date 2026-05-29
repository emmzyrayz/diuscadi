"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { LuLoader } from "react-icons/lu";

// Core Layout Views
import PublicShowcaseView from "@/components/sections/committees/PublicShowcaseView";
import PrivateCommitteeDashboard from "@/components/sections/committees/PrivateCommitteeDashboard";
import { cn } from "../../lib/utils";

export default function CommitteePage() {
  const router = useRouter();
  const { token } = useAuth();
  const { profile, isLoading: profileLoading } = useUser();
  const [checkingGate, setCheckingGate] = useState(true);

   useEffect(() => {
     if (profileLoading) return;
     if (!token || !profile) {
       router.push("/auth");
       return;
     }
     if (profile.role === "participant") {
       router.push("/application");
     }
   }, [profile, profileLoading, token, router]);
  
  

   const gateResolved =
     !profileLoading && !!token && !!profile && profile.role !== "participant";

   if (!gateResolved) {
     return (
       <div
         className={cn(
           "min-h-screen",
           "w-full",
           "flex",
           "items-center",
           "justify-center",
           "bg-background",
         )}
       >
         <div className={cn("flex", "flex-col", "items-center", "gap-3")}>
           <LuLoader
             className={cn("w-8", "h-8", "animate-spin", "text-primary")}
           />
           <span
             className={cn(
               "text-xs",
               "uppercase",
               "tracking-widest",
               "font-mono",
               "text-muted-foreground",
               "animate-pulse",
             )}
           >
             Syncing Org State...
           </span>
         </div>
       </div>
     );
   }

   if (!profile) return null;

   // Fix 4: Extract membership first, then use optional chaining on `.committee`
   // so the null case on CommitteeMembership is handled without a type error.
   const membership = profile.committeeMembership;

  return (
    <main className={cn('min-h-screen', 'w-full', 'relative', 'z-10', 'pt-24', 'pb-16', 'px-4', 'sm:px-6', 'lg:px-8', 'max-w-7xl', 'mx-auto')}>
      {membership?.committee ? (
        <PrivateCommitteeDashboard
          userCommittee={membership.committee}
          userCommitteeRole={membership.role}
        />
      ) : (
        <PublicShowcaseView />
      )}
    </main>
  );
}
