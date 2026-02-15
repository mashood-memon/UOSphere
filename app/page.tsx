import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/blocks/feature-card";
import { Shield, Sparkles, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">UOSphere</div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Find Your Tribe at UOS
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Connect with students who share your interests, form study groups,
              and build meaningful connections within the University of Sindh
              community.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Shield}
            title="Verified Students Only"
            description="Automatic ID card verification ensures you're connecting with real UOS students."
          />
          <FeatureCard
            icon={Sparkles}
            title="Interest-Based Matching"
            description="Find students with similar academic interests, hobbies, and goals."
          />
          <FeatureCard
            icon={Users}
            title="Communities & Groups"
            description="Join department communities, study groups, and interest-based clubs."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of UOS students already connecting on UOSphere.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            &copy; 2026 UOSphere. Exclusively for University of Sindh students.
          </p>
        </div>
      </footer>
    </main>
  );
}
