import { VideoUploader } from "@/components/VideoUploader";
import Image from "next/image";

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Video Fake Detection</h1>
      <VideoUploader />
    </div>
  );
}
