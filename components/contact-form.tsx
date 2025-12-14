"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Mail, Send, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ContactForm() {
  const t = useTranslations()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("contact_error_generic"))
      }

      setSubmitStatus("success")
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      })
    } catch (error) {
      setSubmitStatus("error")
      setErrorMessage(
        error instanceof Error ? error.message : t("contact_error_generic")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-2 text-foreground"
            >
              {t("contact_name_label")}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t("contact_name_placeholder")}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 text-foreground"
            >
              {t("contact_email_label")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t("contact_email_placeholder")}
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium mb-2 text-foreground"
            >
              {t("contact_subject_label")}
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t("contact_subject_placeholder")}
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium mb-2 text-foreground"
            >
              {t("contact_message_label")}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={8}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              placeholder={t("contact_message_placeholder")}
            />
          </div>
        </div>

        {submitStatus === "success" && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-900 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-100">
            <p className="text-sm font-medium">{t("contact_success_message")}</p>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
            <p className="text-sm font-medium">
              {errorMessage || t("contact_error_message")}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("contact_submitting")}
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {t("contact_submit_button")}
            </>
          )}
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-muted/40 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold mb-1">{t("contact_alternative_title")}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {t("contact_alternative_description")}
            </p>
            <a
              href="mailto:support@markdownpreview.org"
              className="text-sm text-foreground hover:text-primary transition-colors"
            >
              support@markdownpreview.org
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
