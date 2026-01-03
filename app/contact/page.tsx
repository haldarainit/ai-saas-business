import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ContactPageForm from "@/components/contact-page-form"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export const metadata: Metadata = {
    title: "Contact Us | Haldar AI & IT",
    description: "Get in touch with Haldar AI & IT. Contact us for AI-powered business automation solutions.",
}

export default function ContactPage() {
    const contactInfo = [
        {
            icon: <Mail className="h-6 w-6" />,
            title: "Email Us",
            description: "Our team will respond within 24 hours",
            value: "info@myhai.in",
            href: "mailto:info@myhai.in",
        },
        {
            icon: <Phone className="h-6 w-6" />,
            title: "Call Us",
            description: "Mon-Fri from 9am to 6pm",
            value: "+91 (XXX) XXX-XXXX",
            href: "tel:+91XXXXXXXXXX",
        },
        {
            icon: <MapPin className="h-6 w-6" />,
            title: "Visit Us",
            description: "Come say hello at our office",
            value: "India",
        },
        {
            icon: <Clock className="h-6 w-6" />,
            title: "Business Hours",
            description: "We're available",
            value: "Monday - Friday, 9am - 6pm IST",
        },
    ]

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-20 md:py-28 bg-gradient-to-b from-muted/50 to-background">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
                        <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground mb-4">
                            Contact Us
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6">
                            Let&apos;s Start a Conversation
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                            Have questions about our AI solutions? Want a personalized demo?
                            Our team is here to help you get started.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
                        {/* Contact Information */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-4">Get in Touch</h2>
                                <p className="text-muted-foreground">
                                    We&apos;d love to hear from you. Whether you have a question about features,
                                    pricing, or anything else, our team is ready to answer all your questions.
                                </p>
                            </div>

                            <div className="grid gap-6">
                                {contactInfo.map((info, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            {info.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{info.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-1">{info.description}</p>
                                            {info.href ? (
                                                <a href={info.href} className="text-sm font-medium text-primary hover:underline">
                                                    {info.value}
                                                </a>
                                            ) : (
                                                <p className="text-sm font-medium">{info.value}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Additional Info */}
                            <div className="p-6 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10">
                                <h3 className="font-semibold mb-2">Enterprise Support</h3>
                                <p className="text-sm text-muted-foreground">
                                    For enterprise clients, we offer dedicated support channels and priority response times.
                                    Contact us to learn more about our enterprise support packages.
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <ContactPageForm />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
