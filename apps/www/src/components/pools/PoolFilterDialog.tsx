import clsx from "clsx";
import { format } from "util";
import { useMemo } from "react";
import { object, string } from "yup";
import { MdClose } from "react-icons/md";
import { IoChevronDownOutline } from "react-icons/io5";
import { Form, Formik, Field, ErrorMessage } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/react";

import { useAuth } from "@/hooks/useAuth";
import { useTRPC, useTRPCClient } from "@/trpc.client";

export default function PoolFilterDialog(
  props: React.ComponentPropsWithoutRef<typeof Dialog>,
) {
  const trpc = useTRPC();
  const router = useRouter();
  const trpcClient = useTRPCClient();
  const searchParams = useSearchParams();
  const { isAuthenticated, signIn } = useAuth();

  const filterFields = useMemo(
    () => [
      { label: "Min Market Cap", name: "market_cap_min", placeholder: "Min" },
      { label: "Max Market Cap", name: "market_cap_max", placeholder: "Max" },
      { label: "Min Volume", name: "h24_volume_usd_min", placeholder: "Min" },
      { label: "Max Volume", name: "h24_volume_usd_max", placeholder: "Max" },
      { label: "Min Age", name: "pool_created_hour_min", placeholder: "Min" },
      { label: "Max Age", name: "pool_created_hour_max", placeholder: "Max" },
      {
        label: "Min Liquidity",
        name: "reserve_in_usd_min",
        placeholder: "Min",
      },
      {
        label: "Max Liquidity",
        name: "reserve_in_usd_max",
        placeholder: "Max",
      },
    ],
    [],
  );

  const { data } = useQuery({
    enabled: Boolean(isAuthenticated),
    queryKey: trpc.poolFilter.list.queryKey(),
    queryFn: () => trpcClient.poolFilter.list.query(),
  });

  const { mutateAsync } = useMutation(trpc.poolFilter.create.mutationOptions());

  return (
    <Formik
      validationSchema={object({ name: string().trim().required() })}
      initialValues={Object.fromEntries(searchParams.entries())}
      onSubmit={async ({ name, ...values }) => {
        if (!isAuthenticated) await signIn();

        return mutateAsync({
          name,
          data: values,
        });
      }}
    >
      {({ values, setValues }) => (
        <Dialog
          as={Form}
          {...props}
          className={clsx("relative", props.className)}
        >
          <div className="fixed inset-0 z-50">
            <div className="relative h-full flex  items-center justify-center">
              <DialogBackdrop className="absolute inset-0 bg-black/50 -z-10" />
              <DialogPanel className="bg-dark mx-4 z-50 lt-sm:min-w-9/10 sm:w-xl">
                <header className="flex p-4 border-b border-b-white/10">
                  <DialogTitle className="flex-1 text-lg font-bold">
                    Pool Filters
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={() => props.onClose?.(false)}
                  >
                    <MdClose size={18} />
                  </button>
                </header>
                <div className="flex-1  flex flex-col space-y-4 p-4">
                  <div className="flex flex-col space-y-2 items-start">
                    <p className="text-light-secondary">Select Saved Filter</p>
                    <Menu
                      as="div"
                      className="relative"
                    >
                      <MenuButton className="flex items-center space-x-4 border border-white/10 p-2 rounded-md">
                        <p className="flex-1 text-gray">Select Filter</p>
                        <IoChevronDownOutline className="text-gray" />
                      </MenuButton>
                      <MenuItems className="absolute inset-x-0 flex flex-col bg-dark-secondary p-4 rounded-md">
                        {data?.map((filter) => (
                          <MenuItem key={filter.id}>
                            <button
                              type="button"
                              onClick={() =>
                                // @ts-expect-error don't type check value
                                setValues(filter.data)
                              }
                            >
                              {filter.name}
                            </button>
                          </MenuItem>
                        ))}
                      </MenuItems>
                    </Menu>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(160px,2fr))]">
                      {filterFields.map((field) => (
                        <div
                          key={field.name}
                          className="flex flex-col space-y-2"
                        >
                          <label
                            htmlFor={field.name}
                            className="text-light-secondary"
                          >
                            {field.label}
                          </label>
                          <Field
                            name={field.name}
                            placeholder={field.placeholder}
                            className="p-2 bg-transparent border border-white/10 placeholder-text-gray rounded-md "
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex flex-col space-y-2 items-start">
                        <label
                          htmlFor="name"
                          className="text-light-secondary"
                        >
                          Save Filter
                        </label>
                        <Field
                          name="name"
                          placeholder="Filter name"
                          className="p-2 bg-transparent border border-white/10 placeholder-text-gray rounded-md "
                        />
                        <ErrorMessage name="name" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4 p-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary p-2 text-black rounded"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="flex-1 border border-primary p-2 text-primary rounded"
                    onClick={() => {
                      const urlSearchParams = new URLSearchParams(searchParams);
                      for (const [key, value] of Object.entries(values))
                        if (value) urlSearchParams.set(key, value);
                      router.push(format("?%s", urlSearchParams.toString()));
                    }}
                  >
                    Apply
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      )}
    </Formik>
  );
}
