import { useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Editor } from "@/components/Editor";

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <Layout>
      <Editor documentId={id} />
    </Layout>
  );
}
