import { FormikContext, useFormik } from "formik";

export default function AccessCodeForm() {
  const formikContext = useFormik({
    initialValues: {
      code: undefined,
      displayName: undefined,
    },
    onSubmit(values) {},
  });

  return <FormikContext value={formikContext}></FormikContext>;
}
