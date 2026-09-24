"use client";

import { Formik, Form, Field, ErrorMessage, type FormikHelpers } from "formik";
import { useState } from "react";
import { useTranslations } from "next-intl";
import * as Yup from "yup";
import { Link, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/Logo";
import { isAbortedError, isApiRequestError, useAbortableRequest } from "@/lib/api";
import { loginRequest } from "@/lib/services/auth";

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const t = useTranslations("Login");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const abortable = useAbortableRequest();

  const schema = Yup.object({
    email: Yup.string().trim().required(t("emailRequired")),
    password: Yup.string().required(t("passwordRequired")),
  });

  async function handleSubmit(
    values: LoginValues,
    { setSubmitting }: FormikHelpers<LoginValues>,
  ) {
    setFormError(null);

    try {
      await loginRequest(
        {
          email: values.email.trim(),
          password: values.password,
        },
        { signal: abortable.nextSignal() },
      );

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (isAbortedError(error)) {
        return;
      }

      if (isApiRequestError(error)) {
        setFormError(
          error.code === "TOO_MANY_REQUESTS" ? error.message : t("invalid"),
        );
        return;
      }

      setFormError(t("invalid"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm md:px-10">
      <Logo className="mx-auto mb-5 h-12 w-auto" />
      <h1 className="text-2xl font-bold text-brand">{t("title")}</h1>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={schema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="mt-8 space-y-5 text-left">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-ink"
              >
                {t("email")} <span className="text-brand">*</span>
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand"
              />
              <ErrorMessage
                name="email"
                component="p"
                className="mt-1 text-sm text-red-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-ink"
              >
                {t("password")} <span className="text-brand">*</span>
              </label>
              <Field
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("passwordPlaceholder")}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand"
              />
              <ErrorMessage
                name="password"
                component="p"
                className="mt-1 text-sm text-red-600"
              />
            </div>

            {formError ? (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-brand hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {isSubmitting ? t("signingIn") : t("submit")}
              <span aria-hidden>→</span>
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
