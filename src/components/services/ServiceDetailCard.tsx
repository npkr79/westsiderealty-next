"use client";

import Image from "next/image";

interface ServiceCard {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  areas?: string[];
  features?: string[];
  color?: string;
  iconColor?: string;
  image?: string;
  imageAlt?: string;
}

interface ServiceDetailCardProps {
  service: ServiceCard;
  flip?: boolean;
}

export default function ServiceDetailCard({ service, flip }: ServiceDetailCardProps) {
  const {
    icon: Icon,
    title,
    description,
    areas = [],
    features = [],
    color = "bg-card border-border",
    iconColor = "text-primary",
    image,
    imageAlt = title,
  } = service;

  const safeImage = image && image.trim() ? image : "/placeholder.svg";

  const content = (
    <div className={`rounded-2xl border ${color} p-6 md:p-8 shadow-sm`}>
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-background/60 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-semibold text-foreground">{title}</h2>
      </div>
      <p className="text-sm md:text-base text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      {areas.length > 0 && (
        <div className="mb-3 text-xs md:text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Key Areas:&nbsp;</span>
          {areas.join(", ")}
        </div>
      )}
      {features.length > 0 && (
        <ul className="mt-3 grid gap-1.5 text-xs md:text-sm text-muted-foreground">
          {features.map((feature, idx) => (
            <li key={idx}>• {feature}</li>
          ))}
        </ul>
      )}
    </div>
  );

  const imageBlock = (
    <div className="relative h-56 md:h-72 w-full overflow-hidden rounded-2xl bg-muted">
      <Image
        src={safeImage}
        alt={imageAlt}
        fill
        className="object-cover"
      />
    </div>
  );

  return (
    <div className={`grid items-center gap-8 md:grid-cols-2 ${flip ? "md:grid-flow-col-dense" : ""}`}>
      {flip ? (
        <>
          {imageBlock}
          {content}
        </>
      ) : (
        <>
          {content}
          {imageBlock}
        </>
      )}
    </div>
  );
}


