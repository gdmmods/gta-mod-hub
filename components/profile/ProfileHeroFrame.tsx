/* eslint-disable @next/next/no-img-element -- Profile images may use public external URLs. */
import type { ReactNode } from "react";
import { publicProfileUrl } from "@/lib/profile/fields";

function profileImage(value: string | null | undefined) {
  if (value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  return publicProfileUrl(value);
}

export default function ProfileHeroFrame({ name, avatar, banner, header, actions, children }: {
  name: string;
  avatar?: string | null;
  banner?: string | null;
  header: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const avatarImage = profileImage(avatar);
  const bannerImage = profileImage(banner);
  return <section className="relative mx-auto max-w-[1450px] px-6 pt-8">
    <div className="relative overflow-hidden rounded-[40px] border border-zinc-800 bg-black shadow-[0_0_80px_rgba(168,85,247,0.10)]">
      <div className="relative h-[240px] overflow-hidden xl:h-[280px]">
        {bannerImage && <img src={bannerImage} alt="" className="h-full w-full scale-[1.02] object-cover opacity-75" />}
        <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_45%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
      </div>
      <div className="relative z-10 -mt-14 px-6 pt-2 pb-10 sm:px-8 xl:px-12 xl:pb-12">
        <div className="flex flex-col gap-10 xl:flex-row">
          <div className="flex shrink-0 flex-col items-start">
            <div className="relative">
              <div aria-hidden="true" className="absolute inset-0 rounded-[34px] bg-purple-500/20 blur-2xl" />
              {avatarImage
                ? <img src={avatarImage} alt={name} className="relative size-32 rounded-[32px] border border-zinc-700 bg-black object-cover shadow-[0_0_40px_rgba(168,85,247,0.25)]" />
                : <span aria-hidden="true" className="relative grid size-32 place-items-center rounded-[32px] border border-zinc-700 bg-zinc-950 text-4xl font-bold text-purple-300">{name.trim().charAt(0).toUpperCase()}</span>}
            </div>
            {actions && <div className="mt-6">{actions}</div>}
          </div>
          <div className="min-w-0 flex-1">
            {header}
            {children}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
