import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth/get-viewer";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function ShapesPage() {
  const supabase = await createClient();
  const viewer = await getViewer();
  const isRegistered = viewer !== null;

  const { data: shapes, error } = await supabase
    .schema("analysis")
    .from("shapes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <section>
      <header className="page-header">
        <div>
          <p>Formen</p>
          <h1>Formen / Pattern</h1>
        </div>

        {isRegistered ? (
          <Link
            className={cn(buttonVariants())}
            href="/app/shapes/new"
          >
            Neue Form
          </Link>
        ) : (
          <Link
            className={cn(buttonVariants())}
            href="/register?next=%2Fapp%2Fshapes%2Fnew"
          >
            Registrieren für neue Formen
          </Link>
        )}
      </header>

      {shapes && shapes.length > 0 ? (
        <div className="experiment-list">
          {shapes.map((shape) => (
            <article
              className="experiment-list__item"
              key={shape.id}
            >
              <div>
                <h2>{shape.name}</h2>
                <p>Typ: {shape.shape_type}</p>
                <small>Sichtbarkeit: {shape.visibility}</small>
              </div>
              <span>
                {new Date(shape.created_at).toLocaleDateString("de-DE")}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Noch keine Formen</h2>
          <p>Öffentliche Pattern erscheinen hier.</p>
        </div>
      )}
    </section>
  );
}
