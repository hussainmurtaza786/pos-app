'use client';
import { Grid } from '@chakra-ui/react';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import { memo } from 'react';
import { FormGenerator } from './formGenerator';
import { CombineFieldInterface, FormSelectField, FormPasswordInputField, FormInputField } from './utils';

interface Props {
  onSubmit?: (values: any, resetForm: () => void) => void | Promise<void>;
  fields: CombineFieldInterface[];
  onChange?: (props: FormikProps<{ form: any }>) => void | Promise<void>;
  initialValues?: object;
  handleValidate?: (values: { form: any }) => ({ form?: any });
  action?: (formData: FormData) => void | Promise<void>
  validateOnBlur?: boolean
  enableReinitialize?: boolean
}

function _Form({ onSubmit, fields, onChange, validateOnBlur = true, initialValues, enableReinitialize, handleValidate, action }: Props) {
  const formGenerator = new FormGenerator(fields);

  /* Removing unknown fields from initialValues which are not meniton in the (fields: CombineFieldInterface[]) */
  initialValues = Object.keys(initialValues || {}).length
    ? formGenerator.removeUnknownFields(JSON.parse(JSON.stringify(initialValues)))
    : undefined;

  // console.log("initialValues ==>", initialValues)

  const handleSubmit = async (values: { form: object }, { setSubmitting, resetForm, setValues }: FormikHelpers<{ form: object }>) => {
    // console.log(values)
    const handleReset = () => { resetForm({ values: formGenerator.getInitialValues() }) };
    if (action) {
      const formData = new FormData();
      formData.append("formValues", JSON.stringify(values.form))
      await action(formData);
    }
    await onSubmit?.(values.form, handleReset);
    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={
        Object.keys(initialValues || {}).length
          ? { form: initialValues }
          : (formGenerator.getInitialValues() as any)
      }
      validationSchema={formGenerator.getValidationSchema()}
      onSubmit={handleSubmit}
      validateOnBlur={validateOnBlur}

      // validate={handleValidate}
      enableReinitialize={enableReinitialize}
    >
      {(formikProps) => {
        const { values, errors } = formikProps;
        // console.log(errors)
        // console.log(values)
        onChange?.(formikProps);
        formGenerator.setFormikProps(formikProps);
        return (
          <Grid as={Form} templateColumns='repeat(12, 1fr)' gap={3}>
            {formGenerator.getFormFieldsJsx()}
          </Grid>
        );
      }}
    </Formik>
  );
}

export default memo(_Form);

export { FormSelectField, FormPasswordInputField, FormInputField }