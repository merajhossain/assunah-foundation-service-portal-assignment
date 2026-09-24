"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import { useTranslations } from "next-intl";
import * as Yup from "yup";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPassword");

  const schema = Yup.object({
    username: Yup.string().required(t("usernameRequired")),
    newPassword: Yup.string()
      .min(6, t("passwordMin"))
      .required(t("newPasswordRequired")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword")], t("passwordsMustMatch"))
      .required(t("confirmPasswordRequired")),
  });

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm md:px-10">
      <h1 className="text-2xl font-bold text-brand md:text-3xl">{t("title")}</h1>

      <Formik
        initialValues={{
          username: "",
          newPassword: "",
          confirmPassword: "",
        }}
        validationSchema={schema}
        onSubmit={() => {}}
      >
        <Form className="mt-8 space-y-5 text-left">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold text-ink"
            >
              {t("username")} <span className="text-brand">*</span>
            </label>
            <Field
              id="username"
              name="username"
              type="text"
              placeholder={t("usernamePlaceholder")}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand"
            />
            <ErrorMessage
              name="username"
              component="p"
              className="mt-1 text-sm text-red-600"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-semibold text-ink"
            >
              {t("newPassword")} <span className="text-brand">*</span>
            </label>
            <Field
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder={t("newPasswordPlaceholder")}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand"
            />
            <ErrorMessage
              name="newPassword"
              component="p"
              className="mt-1 text-sm text-red-600"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-ink"
            >
              {t("confirmPassword")} <span className="text-brand">*</span>
            </label>
            <Field
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={t("confirmPasswordPlaceholder")}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:border-brand"
            />
            <ErrorMessage
              name="confirmPassword"
              component="p"
              className="mt-1 text-sm text-red-600"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {t("submit")}
            <span aria-hidden>→</span>
          </button>
        </Form>
      </Formik>

      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="text-brand hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
