import * as Yup from "yup";

export const loginSchema = Yup.object({
  email: Yup.string().trim().email("Enter a valid email.").required("Email is required."),
  password: Yup.string().required("Password is required."),
});

export type LoginInput = Yup.InferType<typeof loginSchema>;

export async function parseLoginBody(body: unknown): Promise<LoginInput> {
  return loginSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });
}
