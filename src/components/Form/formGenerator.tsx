import { Box, Grid, GridItem, Heading, Spinner, Text, Textarea } from "@chakra-ui/react";
import { ArrayFieldInterface, CombineFieldInterface, FieldGroupInterface, FormArrayField, FormConfirmationCheckBoxField, FormFileField, FormGroupField, FormInputField, FormPasswordInputField, FormRadioField, FormSelectField, FormTextNote, filterNumber } from "./utils";
import * as yup from 'yup';
import { FieldArray, FormikProps } from "formik";
import { Button } from "@/components/ui/button";

export class FormGenerator {
    fields: CombineFieldInterface[];
    formikProps: FormikProps<any> = {} as any;
    validationSchema?: yup.ObjectSchema<any>;
    formFieldsJsx: React.ReactNode[] = [];

    constructor(fields: CombineFieldInterface[]) {
        this.fields = fields;
    }

    setFormikProps(formikProps: FormikProps<any>) {
        this.formikProps = { ...this.formikProps, ...formikProps };
    }

    getInitialValues() {
        return { form: this.generateValues(this.fields) };
    }

    getValidationSchema() {
        return yup.object({ form: yup.object(this.generateSchema(this.fields)) });
    }

    getFormFieldsJsx() {
        return this.generateFormFields(this.fields, "form");
    }

    generateValues(fields: CombineFieldInterface[]) {
        const obj: any = {};
        fields.forEach((f) => {
            if (f.type === "fieldGroup") {
                obj[f.name] = this.generateValues(f.fieldGroup);
            } else if (f.type === "array-field") {
                obj[f.name] = [this.generateValues(f.fieldArrayGroup)];
            } else if (f.type === "text-note" || f.type === "submit") {
                return;
            } else {
                obj[f.name] = f.value || "";
            }
        });
        return obj;
    }

    private generateSchema(fields: CombineFieldInterface[]) {
        const obj: { [key: string]: yup.AnySchema } = {};
        fields.forEach((f) => {
            switch (f.type) {
                case "array-field":
                    obj[f.name] = yup.array().of(yup.object(this.generateSchema(f.fieldArrayGroup)));
                    break;
                case "fieldGroup":
                    obj[f.name] = yup.object(this.generateSchema(f.fieldGroup));
                    break;
                case "text": case "semi-number": case "tel": case "date": case "text-area":
                    obj[f.name] = yup.string(); //.required('Required');
                    break;
                case "its-number":
                    obj[f.name] = yup.string().length(8, "Length must be 8"); //.required('Required');
                    break;
                case "url":
                    obj[f.name] = yup.string().url("Invalid Url"); //.required('Required');
                    break;
                case "confirmation-checkbox":
                    obj[f.name] = yup.boolean().oneOf([true], 'Must be checked'); //.required('Required');
                    break;
                case "number":
                    obj[f.name] = yup.number(); //.required('Required');
                    break;
                case "email":
                    obj[f.name] = yup.string().email("Incorrect email format"); //.required('Required');
                    break;
                case "file":
                    obj[f.name] = yup.mixed<FileList>();
                    break;
                case "custom":
                    obj[f.name] = yup.mixed();
                    break;
                case "select": case "radio":
                    obj[f.name] = yup.string().oneOf(f.options.map(v => typeof v !== 'object' ? v : v.value), "Select a valid value"); //.required('Required');
                    break;
                case "text-note":
                    break;
                default:
                    break;
            }
            if (!f.notRequired && obj[f.name]) {
                if (f.condition) { // if this field depends on a condition
                    /* expected value of fieldName is like in this format. e.g "user.address.postcode" */
                    const splittedFields = f.condition.fieldName.split('.');
                    const endField = splittedFields[splittedFields.length - 1];
                    obj[f.name] = obj[f.name].when(endField, {
                        is: (val: any) => f.condition?.value.includes(val),
                        then: yup => yup.required("Required"),
                        otherwise: yup => yup.notRequired()
                    })
                }
                else
                    obj[f.name] = obj[f.name].required("Required");
            }
        });
        return obj;
    }

    private generateFormFields(fields: CombineFieldInterface[], pName: string /*parent Name*/) {
        return fields.map((f) => {
            // console.log(f.fieldArea)
            const fieldArea = f.fieldArea || 1;

            if (f.type === 'custom') {
                return (
                    <GridItem key={`${pName}.${f.name}`} colSpan={fieldArea} >
                        <f.CustomField {...{ scope: this }} onChange={v => { this.formikProps?.setFieldValue(`${pName}.${f.name}`, v) }} label={f.label} name={`${pName}.${f.name}`} notRequired={f.notRequired} />
                    </GridItem>
                )
            } else if (f.type === "file") {
                return (
                    <FormFileField {...f as any}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                        key={`${pName}.${f.name}`}
                    />
                );
            } else if (f.type === "text-note") {
                return (
                    <FormTextNote key={`${pName}.${f.name}`} {...f as any} />
                );
            } else if (f.type === 'array-field') {
                return (
                    <FormArrayField  {...f as any}
                        scope={this}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                        key={`${pName}.${f.name}`}
                        handleGenerateChildFields={(idx) => this.generateFormFields(f.fieldArrayGroup, `${pName}.${f.name}.${idx}`)}

                    />
                );
            } else if (f.type === "fieldGroup") {
                return (
                    <FormGroupField {...f as any}
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                        handleGenerateChildFields={() => this.generateFormFields(f.fieldGroup, `${pName}.${f.name}`)}
                    />
                    // <Grid p={2.5} pt={1.5} border='1px' borderColor='app.grey2' _focusWithin={{ borderColor: 'app.grey1' }} rounded='lg'
                    //     // border='1px' borderColor='gray'
                    //     key={`${pName}.${f.name}`}
                    //     as={GridItem} colSpan={fieldArea}
                    // >
                    //     <Heading as='h3' fontSize='md' textUnderlineOffset='3px' borderColor='app.grey2' my={2} >{f.label}</Heading>
                    //     <Grid w='full' templateColumns='repeat(12, 1fr)' gap={3} columnGap={2.5} >
                    //         {this.generateFormFields(f.fieldGroup, `${pName}.${f.name}`)}
                    //     </Grid>
                    // </Grid>
                );
            } else if (f.type === "select") {
                return (
                    <FormSelectField {...f}
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                    />
                );
            } else if (f.type === "confirmation-checkbox") {
                return (
                    <FormConfirmationCheckBoxField {...f}
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                    />
                );
            } else if (f.type === "radio") {
                return (
                    <FormRadioField {...f}
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                    />
                );
            } else if (["its-number", "semi-number"].includes(f.type)) {
                return (
                    <FormInputField {...f}
                        type="text"
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                        onChange={(e: any) => {
                            filterNumber({
                                e,
                                handleChange: this.formikProps?.handleChange!,
                                formating: false,
                            });
                        }}
                    />
                );
            } else if (f.type === "tel") {
                return (
                    <FormInputField {...f}
                        type="tel"
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                        onChange={(e: any) => {
                            filterNumber({
                                e,
                                handleChange: this.formikProps?.handleChange!,
                                include: ['+'],
                                formating: false,
                            });
                        }}
                    />
                );
            } else if (["number", "date", "datetime-local", "url"].includes(f.type)) {
                return (
                    <FormInputField {...f}
                        type={f.type as any}
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                    />
                );
            } else if (f.type === 'password') {
                return (
                    <FormPasswordInputField {...f}
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                    />
                );
            }
            else if (f.type === "submit") {
                const { isSubmitting = true, errors } = this.formikProps;
                return (
                    <GridItem
                        key={`${pName}.${f.name}`} mt={5}
                        colSpan={fieldArea} display='flex' justifyContent='center'
                    >
                        <Button bgColor='#2563EB' loading={isSubmitting} loadingText="Submitting..." color='white' px='5' py={5} rounded='md' size={{ base: 'sm', lg: 'md' }}
                            type={f.type}
                            disabled={isSubmitting} aria-disabled={isSubmitting}
                            {...f.inputProps}
                        // color={isSubmitting ? "disabled" : "secondary"}
                        // size="small"
                        >
                            {f.label}
                        </Button>
                    </GridItem>
                );
            } else if (f.type === 'text-area') {
                return (
                    <FormInputField {...f}
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                    />
                );
            } else {
                return (
                    <FormInputField {...f}
                        type="text"
                        key={`${pName}.${f.name}`}
                        name={`${pName}.${f.name}`}
                        required={!f.notRequired}
                    />
                );
            }
        });
    }

    /**
     * this method will be used to remove unknown fields from initialValues of Form
     * @param initialValues
     * What is does: Eg: there is an object => {id:'foo', name:'bar', school: {id:'1', grade:'7th'} }
     *  after passing this object as initialValues in this method it remove unknown values like id which
     *  was not mentioned in ( fields: CombineFieldInterface[] )
     *  Eg output: { name:'bar', school: { grade:'7th' } }
     */
    removeUnknownFields(initialValues: any /* should be an object */) {
        // console.log("Initial values", initialValues);
        _removeUnknownFields(this.fields, initialValues);
        function _removeUnknownFields(fieldGroup: CombineFieldInterface[], _object: any) {
            const fields = fieldGroup.map((f) => f.name);
            Object.keys(_object).forEach((f) => {
                // const fields = this.fields.map(f => f.name);
                if (!fields.includes(f)) delete _object[f];

                else if (Array.isArray(_object[f]) && (!_object[f][0] || _object[f][0] instanceof File)) {

                } else if (Array.isArray(_object[f])) {
                    const { fieldArrayGroup: _fieldArrayGroup } = fieldGroup.filter(
                        (v) => v.type === "array-field" && v.name === f
                    )[0] as ArrayFieldInterface;
                    _object[f].forEach((_childObject: any) => {
                        _removeUnknownFields(_fieldArrayGroup, _childObject);
                    })
                } else if (_object[f] === null) {
                    delete _object[f]

                } else if (typeof _object[f] === "object" && fieldGroup.find(v => v.type === 'custom' && v.name === f)) {

                } else if (typeof _object[f] === "object") {
                    // console.log(_object);

                    const { fieldGroup: _fieldGroup } = fieldGroup.filter(
                        (v) => v.type === "fieldGroup" && v.name === f
                    )[0] as FieldGroupInterface;
                    _removeUnknownFields(_fieldGroup, _object[f]);
                }

            });
        }
        return initialValues;
    }
}