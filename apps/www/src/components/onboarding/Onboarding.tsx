"use client";

import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import { object, string } from "yup";
import { toast } from "react-toastify";
import { AuthStatus } from "@civic/auth";
import { useCookies } from "react-cookie";
import { useUser } from "@civic/auth/react";
import { useCallback, useMemo, useState } from "react";
import { Field, Form, FormikContext, useFormik } from "formik";
import { TabGroup, TabPanel, TabPanels } from "@headlessui/react";

import Logo from "@/assets/logo.png";
import { useTRPCClient } from "@/trpc.client";
import OnboardingBg from "@/assets/onboarding-bg.png";

export default function Onboarding({ children }: React.PropsWithChildren) {
  const trpcClient = useTRPCClient();
  const { authStatus, signIn } = useUser();
  const [cookies, setCookie] = useCookies<
    "referralCode" | "displayName" | "user",
    { referralCode: string; user: string; displayName: string }
  >(["referralCode", "user", "displayName"]);
  const [currentTab, setCurrentTab] = useState(() => {
    if (cookies.referralCode) return 1;
    return 0;
  });
  const isAuthenticated = useMemo(
    () => authStatus === AuthStatus.AUTHENTICATED,
    [authStatus],
  );

  const formikContext = useFormik({
    initialValues: cookies,
    validationSchema: object({
      displayName: string().label("display name").required(),
      referralCode: string().required(),
    }),
    onSubmit(values) {
      setCookie("displayName", values.displayName);
    },
  });

  const { values, setFieldError, errors, validateField } = formikContext;

  const verifyCode = useCallback(
    async (code: string) => {
      const { exists, referer } = await trpcClient.refer.verify.query({ code });
      if (exists) {
        setCookie("referralCode", code);
        if (referer) setCookie("user", referer.id);

        return true;
      }

      setFieldError("referralCode", "This code is not valid.");
      return false;
    },
    [trpcClient, setFieldError, setCookie],
  );

  const onNext = useCallback(async () => {
    await validateField("referralCode");
    if (!isAuthenticated) await signIn();
    const isValid = await verifyCode(values.referralCode);
    if (isValid) setCurrentTab(1);
  }, [values, verifyCode, signIn, validateField, isAuthenticated]);

  if (values.displayName) return children;

  return (
    <FormikContext value={formikContext}>
      <Form className="flex-1 flex flex-col px-8 py-32 relative">
        <Image
          src={OnboardingBg}
          width={2560}
          height={2560}
          className="absolute w-full h-full object-cover inset-0 z-0"
          alt="Onboarding"
        />
        <div className="flex-1 flex items-center justify-center">
          <Image
            src={Logo}
            width={512}
            height={512}
            alt="Logo"
          />
        </div>
        <TabGroup
          as="div"
          className="z-10"
          selectedIndex={currentTab}
          onChange={setCurrentTab}
        >
          <TabPanels>
            <TabPanel className="flex flex-col space-y-8">
              <div className="flex flex-col space-y-2">
                <Field
                  name="referralCode"
                  placeholder="Enter Code"
                  className={clsx(
                    "border  bg-black/2 p-3 rounded focus:border-primary",
                    errors.referralCode ? "border-red" : "border-white/5",
                  )}
                />
                <div className="flex">
                  <small className="flex-1 text-red first-letter:uppercase">
                    {errors.referralCode}
                  </small>
                  <Link
                    href={process.env.NEXT_PUBLIC_TELEGRAM_LINK!}
                    target="_blank"
                    className="text-xs text-primary text-end"
                  >
                    Get Code
                  </Link>
                </div>
              </div>
              <button
                type="button"
                className="bg-primary text-black p-3 rounded"
                onClick={() =>
                  toast.promise(onNext, {
                    pending: "Verifying code...",
                    error: "Oops! An unexpected error occured.",
                    success: "🎉 Welcome to rhiva.fun. Code verified.",
                  })
                }
              >
                Next
              </button>
            </TabPanel>
            <TabPanel className="flex flex-col space-y-8">
              <div className="flex flex-col space-y-2">
                <Field
                  name="displayName"
                  placeholder="Choose Display Name"
                  className={clsx(
                    "border  bg-black/2 p-3 rounded focus:border-primary",
                    errors.displayName ? "border-red" : "border-white/5",
                  )}
                />
                <small className="flex-1 text-red first-letter:uppercase">
                  {errors.displayName}
                </small>
              </div>
              <button
                type="submit"
                className="bg-primary text-black p-3 rounded"
              >
                Submit
              </button>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Form>
    </FormikContext>
  );
}
