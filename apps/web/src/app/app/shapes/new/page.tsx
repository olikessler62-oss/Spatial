import Link from "next/link";

import { createShape } from "../../actions";
import { requireRegisteredPage } from "@/lib/auth/access";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export default async function NewShapePage() {
  await requireRegisteredPage("/app/shapes/new");

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Formen</p>
          <h1>Neue Form</h1>
        </div>

        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/app/shapes"
        >
          Zurück
        </Link>
      </header>

      <form
        className="flex max-w-xl flex-col gap-4 rounded-xl border border-border bg-card p-6"
        action={createShape}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Zum Beispiel: Quadrat 2x2"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shapeType">Formtyp</Label>
          <NativeSelect
            id="shapeType"
            name="shapeType"
            required
            defaultValue="relative"
          >
            <option value="relative">Relativ</option>
          </NativeSelect>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="/app/shapes"
          >
            Abbrechen
          </Link>
          <Button type="submit">Form speichern</Button>
        </div>
      </form>
    </section>
  );
}
