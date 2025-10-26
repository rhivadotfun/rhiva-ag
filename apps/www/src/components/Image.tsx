import { useState } from "react";
import _Image from "next/image";

type ImageProps = {
  src?: string | null;
  alt?: string | null;
  errorProps?: React.ComponentProps<"div">;
} & Omit<React.ComponentProps<typeof _Image>, "src" | "alt" | "onError">;

export default function Image({ errorProps, ...props }: ImageProps) {
  const [error, setError] = useState(false);

  if (props.src) {
    if (error && errorProps) return <div {...errorProps} />;
    return (
      <_Image
        {...props}
        src={props.src}
        alt={props.alt ?? "Default"}
        onError={() => setError(true)}
      />
    );
  } else return <div {...errorProps} />;
}
