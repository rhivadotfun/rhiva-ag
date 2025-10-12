"use client";
import { toast } from "react-toastify";
import { Form, Formik, Field } from "formik";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/trpc.client";
import Toggle from "@/components/Toggle";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import RebalanceTime from "@/components/settings/RebalanceTime";
import RebalanceType from "@/components/settings/RebalanceType";
import type { AuthContextArgs } from "@/providers/AuthProvider.client";

export default function SettingsPage() {
  const trpc = useTRPC();
  const { user, setUser } = useAuth();

  const { mutateAsync } = useMutation(
    trpc.settings.update.mutationOptions({
      onSuccess(settings) {
        setUser(
          (previous) =>
            ({ ...previous, settings }) as NonNullable<AuthContextArgs["user"]>,
        );
      },
    }),
  );

  return (
    user && (
      <div className="flex-1 flex flex-col space-y-8 overflow-y-scroll lt-sm:fixed lt-sm:inset-0 lt-md:z-50 lt-sm:bg-dark">
        <Header
          canBack
          title="Settings"
          className="sticky top-0 z-10"
        />
        <div className="flex-1 flex flex-col px-4  overflow-y-scroll md:self-center md:min-w-2xl">
          <Formik
            initialValues={user.settings}
            onSubmit={(values) =>
              mutateAsync(values).then(() =>
                toast.success("Settings updated successfully"),
              )
            }
          >
            {({ values, setFieldValue, isSubmitting }) => (
              <Form className="flex flex-col space-y-4 ">
                <div className="flex flex flex-col space-y-4 bg-white/3 border border-white/10 backdrop-blur-3xl p-4 rounded-md">
                  <div className="flex items-center">
                    <label
                      htmlFor="slippage"
                      className="flex-1"
                    >
                      Slippage
                    </label>
                    <Field
                      name="slippage"
                      className="flex-1 p-2 border border-white/10 rounded focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center">
                    <label
                      htmlFor="gasPriorityFee"
                      className="flex-1"
                    >
                      Gas priority fee
                    </label>
                    <Field
                      name="gasPriorityFee"
                      className="flex-1 p-2 border border-white/10 rounded focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center">
                    <label
                      htmlFor="rebalanceTime"
                      className="flex-1"
                    >
                      Rebalance time
                    </label>
                    <RebalanceTime
                      className="flex-1"
                      value={values.rebalanceTime}
                      onChange={(value) =>
                        setFieldValue("rebalanceTime", value)
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-8">
                    <label
                      htmlFor="slippage"
                      className="flex-1"
                    >
                      Auto claim
                    </label>
                    <div className="flex-1">
                      <Toggle
                        value={values.enableAutoClaim}
                        onChange={(value) =>
                          setFieldValue("enableAutoClaim", value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <label
                      htmlFor="slippage"
                      className="flex-1"
                    >
                      Auto compound
                    </label>
                    <div className="flex-1">
                      <Toggle
                        value={values.enableAutoCompound}
                        onChange={(value) =>
                          setFieldValue("enableAutoCompound", value)
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label
                      htmlFor="slippage"
                      className="flex-1 text-nowrap"
                    >
                      Rebalancing type
                    </label>
                    <RebalanceType
                      className="flex-1"
                      value={values.rebalanceType}
                      onChange={(value) =>
                        setFieldValue("rebalanceType", value)
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-8">
                    <label
                      htmlFor="slippage"
                      className="flex-1"
                    >
                      Message Notifications
                    </label>
                    <div className="flex-1">
                      <Toggle
                        value={values.enableNotifications}
                        onChange={(value) =>
                          setFieldValue("enableNotifications", value)
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center min-w-36 bg-primary text-black px-3 rounded"
                  >
                    {isSubmitting ? (
                      <div className="my-1.5 size-6 border-3 border-t-transparent border-black rounded-full animate-spin" />
                    ) : (
                      <span className="py-2">Save</span>
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    )
  );
}
