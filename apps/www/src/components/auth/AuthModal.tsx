import clsx from "clsx";
import type z from "zod";
import { format } from "util";
import Image from "next/image";
import { useMemo } from "react";
import { object, string } from "yup";
import { toast } from "react-toastify";
import { useCookies } from "react-cookie";
import { Field, Form, Formik } from "formik";
import { useWallet } from "@solana/wallet-adapter-react";
import { MdArrowForward, MdClose } from "react-icons/md";
import type { safeAuthUserSchema } from "@rhiva-ag/trpc";
import type { ActionCodeSettings } from "firebase-admin/auth";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  getAuth,
  sendSignInLinkToEmail,
  signInWithPopup,
  type User,
  type GoogleAuthProvider,
  type FacebookAuthProvider,
} from "firebase/auth";

import Logo from "@/assets/logo-sm.png";

export type AuthModalProps = {
  onSignIn(user: User): Promise<z.infer<typeof safeAuthUserSchema>>;
} & React.ComponentProps<typeof Dialog>;

type AuthConnector = {
  name: string;
  icon: React.ElementType;
  provider: typeof FacebookAuthProvider | typeof GoogleAuthProvider;
};

export default function AuthModal({ onSignIn, ...props }: AuthModalProps) {
  const { wallets, select } = useWallet();
  const auth = useMemo(() => getAuth(), []);
  const [cookies, setCookie] = useCookies<"email", { email: string }>([
    "email",
  ]);
  const authConnectors: AuthConnector[] = useMemo(() => [], []);

  return (
    <Dialog
      {...props}
      className={clsx(props.className, "relative z-100")}
    >
      <div className="fixed flex flex-col inset-0">
        <DialogBackdrop className="absolute inset-0 bg-black/50 backdrop-blur-sm -z-10" />
        <DialogPanel className="m-auto flex flex-col space-y-8 bg-dark p-4 rounded-2xl z-10 lt-sm:min-w-xs sm:w-sm">
          <header className="flex flex-col">
            <button
              type="button"
              className="self-end"
              onClick={() => props.onClose(false)}
            >
              <MdClose size={18} />
            </button>
            <div className="self-center flex flex-col space-y-2">
              <Image
                src={Logo}
                width={24}
                height={24}
                alt="Rhiva"
                className="self-center"
              />
              <p className="text-center">Log in or create account</p>
            </div>
          </header>
          <div className="flex flex-col space-y-4">
            <Formik
              validationSchema={object({
                email: string().email().required(),
              })}
              initialValues={{
                email: cookies.email,
              }}
              onSubmit={async (values) => {
                const actionCodeSettings: ActionCodeSettings = {
                  url: window.location.href,
                  handleCodeInApp: true,
                  linkDomain: "auth.rhiva.fun",
                };

                setCookie("email", values.email);
                return sendSignInLinkToEmail(
                  auth,
                  values.email,
                  actionCodeSettings,
                )
                  .then(() => {
                    props.onClose?.(false);
                    toast.success(
                      format("🎉 Login email sent to %s.", values.email),
                    );
                  })
                  .catch(() =>
                    toast.error("Oops! An unexpected error occured."),
                  );
              }}
            >
              {({ errors, isSubmitting }) => (
                <Form className="flex flex-col space-y-1">
                  <div
                    className={clsx(
                      "flex items-center space-x-4 bg-black/25 px-2 border  rounded-md",
                      errors.email
                        ? "border-red-500"
                        : "border-white/10 focus-within:border-primary",
                    )}
                  >
                    <Field
                      name="email"
                      placeholder="Enter email address"
                      className="flex-1 p-3"
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center size-8 bg-primary rounded-full"
                    >
                      {isSubmitting ? (
                        <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MdArrowForward
                          className="m-auto text-black"
                          size={24}
                        />
                      )}
                    </button>
                  </div>
                  <small className="text-red-500 first-letter:uppercase">
                    {errors.email}
                  </small>
                </Form>
              )}
            </Formik>
            {authConnectors.length > 0 ||
              (wallets.length > 0 && (
                <div className="flex items-center space-x-2">
                  <hr className="flex-1 border-white/25" />
                  <p className="text-center">OR</p>
                  <hr className="flex-1 border-white/25" />
                </div>
              ))}
            <div className="grid grid-cols-1 gap-2">
              {authConnectors.map((authConnector) => (
                <button
                  key={authConnector.name}
                  type="button"
                  className="flex items-center space-x-2 border border-white/10 p-2 rounded-md"
                  onClick={async () => {
                    const provider = new authConnector.provider();
                    return signInWithPopup(auth, provider).then(({ user }) =>
                      onSignIn(user),
                    );
                  }}
                >
                  <authConnector.icon size={24} />
                  <span className="text-start capitalize">
                    {authConnector.name}
                  </span>
                </button>
              ))}
              {wallets.map((wallet) => (
                <button
                  key={wallet.adapter.name}
                  type="button"
                  className="flex items-center space-x-2 border border-white/10 p-2 rounded-md"
                  onClick={() => select(wallet.adapter.name)}
                >
                  <Image
                    src={wallet.adapter.icon}
                    width={24}
                    height={24}
                    alt={wallet.adapter.name}
                  />
                  <span>{wallet.adapter.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-white/75 text-center">
            <span>By continuing, you agree to our</span>&nbsp;
            <a
              href="legal.rhiva.fun"
              className="text-primary"
            >
              Terms&nbsp;
            </a>
            <span>and </span>
            <a
              href="legal.rhiva.fun"
              className="text-primary"
            >
              Privacy <br /> Policy
            </a>
            .
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
