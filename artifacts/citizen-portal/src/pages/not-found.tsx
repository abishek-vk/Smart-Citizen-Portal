import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";
import { easeOutExpo } from "@/components/motion";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background px-5 py-6">
      <div aria-hidden className="bg-street-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <Link href="/" className="relative"><Wordmark /></Link>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: easeOutExpo }}
        className="relative m-auto max-w-md text-center"
      >
        <p className="font-display text-[7rem] font-normal leading-none tracking-[-0.06em] text-primary" data-no-translate="true">
          4<span className="text-secondary">0</span>4
        </p>
        <h1 className="mt-4 font-display text-2xl font-normal">This street doesn't exist</h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for may have moved, or the link is incorrect.</p>
        <Button asChild className="mt-8 rounded-full px-6">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Return home</Link>
        </Button>
      </motion.div>
    </div>
  );
}
