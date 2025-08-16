'use client';
import { HTMLProps, ReactNode, memo, useState, useEffect, useCallback, ChangeEvent, useRef, useMemo } from "react";
import { FieldArray, useField, } from "formik";
import { InputProps, Input, GridItem, Box, Grid, Heading, Icon, Stack, Text, createListCollection, SelectRootProps, RadioGroupRootProps, GridItemProps, Textarea, Fieldset, FileUploadRootProps, Select, Portal, NativeSelect, Field } from "@chakra-ui/react";
import { SelectContent, SelectItem, SelectLabel, SelectRoot, SelectTrigger, SelectValueText, } from "@/components/ui/select"
import { FaPlusCircle, FaMinusCircle } from "react-icons/fa";
import { FormGenerator } from "./formGenerator";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Checkbox } from "@/components/ui/checkbox";
import { Field as FormControl } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input"
import { FileInput, FileUploadClearTrigger, FileUploadDropzone, FileUploadLabel, FileUploadList, FileUploadRoot } from "@/components/ui/file-upload";
import { InputGroup } from "@/components/ui/input-group";
import { CloseButton } from "@/components/ui/close-button";
import { LuFileUp } from "react-icons/lu";

export const FormInputField = memo(({ type, name, label, required, fieldArea, onChange, condition, notRequired, inputProps = {}, ...others }: Omit<InputProps, 'label'> & FieldInterface) => {
    const [field, meta, helpers] = useField({ name: name! });
    const visible = useIsVisible({ name, condition }, (isVisible) => !isVisible && helpers.setValue(''))

    if (!visible) return null

    const InputComp = type === "text-area" ? Textarea : Input;

    return (
        <GridItem colSpan={fieldArea} alignContent='end' >
            <FormControl aria-label={name} label={label} required={required} invalid={!!meta.error && meta.touched} errorText={meta.error}>
                {/* {label && <FormLabel mb={1} fontSize='sm'>{label}{required && "*"}</FormLabel>} */}
                <InputComp {...others as any} variant='subtle' value={field.value} onBlur={field.onBlur} type={type} size='xs' name={name} onChange={onChange || field.onChange as any} required={required} {...inputProps} />
            </FormControl>
        </GridItem>
    )
})

export const FormConfirmationCheckBoxField = memo(({ type, name, label, required, fieldArea, onChange, condition, notRequired, inputProps = {}, ...others }: Omit<HTMLProps<InputProps>, "label"> & FieldInterface) => {
    const [field, meta, helpers] = useField({ name: name! });
    const visible = useIsVisible({ name, condition }, (isVisible) => !isVisible && helpers.setValue(''))
    if (!visible) return null
    return (
        <GridItem colSpan={fieldArea} alignItems='end' >
            <FormControl aria-label={name} invalid={!!meta.error && meta.touched} required={required} errorText={meta.error}>
                {/* {label && <FormLabel mb={1} fontSize='sm'>{label}{required && "*"}</FormLabel>} */}
                <Checkbox checked={!!field.value} name={name} variant='subtle' colorScheme='blue' onBlur={field.onBlur} onCheckedChange={v => helpers.setValue(v.checked)} {...inputProps} >
                    {label}
                </Checkbox>
            </FormControl>
        </GridItem>
    )
})

export const FormPasswordInputField = memo(({ name, label, required, fieldArea, onChange, condition, notRequired, inputProps = {}, ...others }: Omit<HTMLProps<InputProps>, "label"> & FieldInterface) => {
    const [field, meta, helpers] = useField({ name: name! });
    const visible = useIsVisible({ name, condition }, (isVisible) => !isVisible && helpers.setValue(''))

    if (!visible) return null

    return (
        <GridItem colSpan={fieldArea} alignItems='end' >
            <FormControl invalid={!!meta.error && meta.touched} label={label} required={required} errorText={meta.error}>
                <PasswordInput {...others as any} value={field.value} variant='subtle' onBlur={field.onBlur} size='xs' name={name} onChange={onChange || field.onChange as any} required={required} {...inputProps} />
            </FormControl>
        </GridItem>
    )
})

export const FormSelectField = memo(({ name, className, label, required, options, fieldArea, condition, notRequired, inputProps = {}, ...others }: Omit<HTMLProps<SelectRootProps>, "label"> & SelectFieldInterface) => {
    const [field, meta, helpers] = useField({ name: name! })
    const visible = useIsVisible({ name, condition }, (isVisible) => !isVisible && helpers.setValue(''))

    // const frameworks = useMemo(() => {
    //     return createListCollection({
    //         items: options.map((o, idx) => {
    //             const value = typeof o !== 'object' ? o : o.value;
    //             const label = typeof o !== 'object' ? o : o.label;
    //             return { value, label }
    //         }),
    //     })
    // }, [])

    const items = options.map((o, idx) => {
        const value = typeof o !== 'object' ? o : o.value;
        const label = typeof o !== 'object' ? o : o.label;
        return { value, label }
    })

    const handleSetValue = useCallback((value: typeof field['value'] | string) => {
        helpers.setValue(value as any, true)
        helpers.setTouched(true, true)
    }, [helpers])


    if (!visible) return null
    return (
        <GridItem colSpan={fieldArea} alignItems='end' >
            <Field.Root aria-label={name} required={required} invalid={!!meta.error && meta.touched}
                onBlur={field.onBlur} onChange={e => handleSetValue((e.target as any).value)} {...inputProps}
            >
                <Field.Label>{label}{required && "*"}</Field.Label>
                <NativeSelect.Root variant='subtle' size='sm'>
                    <NativeSelect.Field value={field.value || ""} placeholder={inputProps.placeholder || `Select ${label}`} >
                        {items.map((o, idx) => (
                            <option value={o.value} key={idx}>{o.label}</option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Field.ErrorText color='fg.error' >{meta.error}</Field.ErrorText>
            </Field.Root>
        </GridItem>
    )
})

export const FormRadioField = memo(({ name, className, alignVertical, label, required, options, fieldArea, condition, notRequired, inputProps = {}, ...others }: Omit<HTMLProps<RadioGroupRootProps>, "label"> & RadioFieldInterface) => {
    //    console.log(fieldArea)
    const [field, meta, helpers] = useField({ name: name! })
    const visible = useIsVisible({ name, condition }, (isVisible) => !isVisible && helpers.setValue(''))

    const handleSetValue = useCallback((value: typeof field['value'] | string) => {
        helpers.setValue(value as any, true)
        helpers.setTouched(true, true)
    }, [helpers])

    if (!visible) return null

    return (
        <GridItem colSpan={fieldArea} alignItems='end' >
            <Fieldset.Root aria-required={required} invalid={!!meta.error && meta.touched}>
                {label && <Fieldset.Legend mb="2">{label}{required && "*"}</Fieldset.Legend>}
                <RadioGroup variant='outline' colorPalette='blue' aria-required={required} value={meta.value} onValueChange={e => handleSetValue(e.value)} >
                    <Stack gap={5} direction={alignVertical ? 'column' : 'row'} css={{ "& *": { fontSize: 'sm' } }}>
                        {options.map((o, idx) => {
                            const value = typeof o !== 'object' ? o : o.value;
                            const label = typeof o !== 'object' ? o : o.label;
                            return <Radio key={idx} value={value}>{label}</Radio>
                        })}
                    </Stack>
                </RadioGroup>
            </Fieldset.Root>
        </GridItem>
    )
})

export const FormFileField = memo(({ name, accept, className, description, multiple, maxFiles, maxFileSize, label, required, fieldArea, condition, notRequired, showDropArea, inputProps, ...others }: Omit<HTMLProps<HTMLInputElement>, "label"> & FileFieldInterface) => {
    const [field, meta, helpers] = useField<File[] | undefined>({ name: name! });
    // const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSetValue = useCallback(async (value: typeof field['value'] | string) => {
        value = value?.length ? value : ""
        await helpers.setValue(value as any, true)
        await helpers.setTouched(true, true)
    }, [helpers])

    const visible = useIsVisible({ name, condition }, (isVisible) => !isVisible && handleSetValue(undefined))

    // console.log("field?.value ==>", field?.value)
    if (!visible) return null
    return (
        <GridItem colSpan={fieldArea}  >
            <FileUploadRoot allowDrop={showDropArea} maxFiles={multiple ? (maxFiles ? maxFiles : 10) : undefined} maxFileSize={maxFileSize} borderBottom={showDropArea ? "" : '1px solid #0000001c'} required={required} alignItems="stretch" accept={accept} onFileChange={e => handleSetValue(e.acceptedFiles)} >
                {!showDropArea && label && <FileUploadLabel>{label}{required && <span>*</span>}</FileUploadLabel>}

                {!showDropArea && <InputGroup w="full" startElement={<Box asChild ml='2' ><LuFileUp /></Box>}
                    endElement={
                        <FileUploadClearTrigger asChild >
                            <CloseButton me="-1" size="xs" variant="plain" focusVisibleRing="inside" focusRingWidth="2px" pointerEvents="auto" color="fg.subtle" />
                        </FileUploadClearTrigger>
                    }
                >
                    <FileInput border='0' required={required} truncate {...inputProps} />
                </InputGroup>}

                {showDropArea && <>
                    <FileUploadDropzone w='full'
                        label={label} rounded='xl' minH='100px'
                        required={required}
                        {...inputProps}
                    />
                    <FileUploadList showSize clearable css={{ '&>*': { p: 2 } }} />
                </>}

            </FileUploadRoot>
            {/* <FileUploadRoot maxW="xl" alignItems="stretch" maxFiles={10}>
                <FileUploadDropzone
                    label="Drag and drop here to upload"
                    description=".png, .jpg up to 5MB"
                />
                <FileUploadList  />
            </FileUploadRoot> */}
            <Text fontSize='sm' color='red.600' >{meta.touched && meta.error}</Text>
            <Text fontSize='sm' color='app.blue2' mt='1' >{description}</Text>
        </GridItem>
    )
})

export const FormTextNote = memo(({ name, className, element, label, required, fieldArea, condition, notRequired, ...others }: Omit<HTMLProps<any>, "label"> & TextNoteFieldInterface) => {
    const visible = useIsVisible({ name, condition })
    if (!visible) return null
    return (
        <GridItem colSpan={fieldArea} alignItems='end'>
            {element}
        </GridItem>
    )
})

type FormGroupFieldProps = HTMLProps<InputProps> & FieldGroupInterface & {
    // children: (p: { fieldArrayGroup: CombineFieldInterface[], name: string }) => JSX.Element[]
    handleGenerateChildFields: () => ReactNode
    // scope: FormGenerator
}
export const FormGroupField = memo(({ type, name, label, fieldGroup, required, fieldArea, onChange, condition, handleGenerateChildFields, notRequired, ...others }: FormGroupFieldProps) => {
    // const [field, meta, helpers] = useField<any[]>({name: name! });
    const visible = useIsVisible({ name, condition })

    if (!visible) return null

    return (
        <GridItem p={2.5} pt={1.5} border='1px' borderColor='app.grey2' _focusWithin={{ borderColor: 'app.grey1' }} rounded='lg'
            // border='1px' borderColor='gray'
            colSpan={fieldArea}
        >
            <Heading as='h3' fontSize='md' textUnderlineOffset='3px' borderColor='app.grey2' my={2} >{label}</Heading>
            <Grid w='full' templateColumns='repeat(12, 1fr)' gap={3} columnGap={2.5} >
                {handleGenerateChildFields()}
            </Grid>
        </GridItem>
    )
})

type FormArrayFieldProps = HTMLProps<InputProps> & ArrayFieldInterface & {
    // children: (p: { fieldArrayGroup: CombineFieldInterface[], name: string }) => JSX.Element[]
    handleGenerateChildFields: (index: number) => ReactNode
    scope: FormGenerator
}
export const FormArrayField = memo(({ type, name, label, labelForAddNewItem, scope, fieldArrayGroup, itemLabel, required, fieldArea, onChange, condition, handleGenerateChildFields, notRequired, ...others }: FormArrayFieldProps) => {
    //    console.log(fieldArea)
    const [field, meta, helpers] = useField<any[]>({ name: name! });
    const visible = useIsVisible({ name, condition })

    if (!visible) return null

    return (
        <FieldArray name={name!}
            render={arrayHelper => {
                const handleAddNew = () => {
                    arrayHelper.insert(field.value?.length || 1, scope.generateValues(fieldArrayGroup))
                }
                return <GridItem pos='relative' p={2.5} pt={1.5} border='1px' borderColor='app.grey2' _focusWithin={{ borderColor: 'app.grey1' }} rounded='lg'
                    colSpan={12}
                >
                    <Heading w='full' as='h3' fontSize='md' textUnderlineOffset='3px' borderColor='app.grey2' my={2} >{label}</Heading>
                    {labelForAddNewItem ?
                        <Box onClick={handleAddNew} display='inline' pos='absolute' zIndex={1} right='8px' bottom='-16px' >
                            {labelForAddNewItem}
                        </Box> :
                        <Icon cursor='pointer' color='app.maroon1' as={FaPlusCircle} onClick={handleAddNew} boxSize={5} pos='absolute' right='8px' bottom='-10px' />
                    }

                    <Grid w='full' templateColumns='repeat(12, 1fr)' gap={3} columnGap={2.5} >
                        {field.value?.map((_, idx) => {
                            return <Grid pos='relative' key={idx} p={2.5} pt={1.5} border='1px' borderColor='app.grey2' _focusWithin={{ borderColor: 'app.grey1' }} rounded='lg'
                                as={GridItem} columnSpan={'12'}
                            >
                                <Heading as='h3' fontSize='md' textUnderlineOffset='3px' borderColor='app.grey2' mb={1} >
                                    {itemLabel && (typeof itemLabel === 'function' ? itemLabel?.({ index: idx }) : `${itemLabel} ${idx + 1}`)}
                                </Heading>
                                <Icon cursor='pointer' as={FaMinusCircle} onClick={() => arrayHelper.remove(idx)} color='app.maroon1' boxSize={5} pos='absolute' right='8px' top='-8px' />
                                <Grid w='full' templateColumns='repeat(12, 1fr)' gap={3} columnGap={2.5} >
                                    {/* {this.generateFormFields(f.fieldArrayGroup, `${pName}.${f.name}.0`)} */}
                                    {/* {children({ fieldArrayGroup: fieldArrayGroup!, name: `${name}.0` })} */}
                                    {handleGenerateChildFields(idx)}
                                </Grid>
                            </Grid>
                        })}
                    </Grid>
                </GridItem>
            }}
        />
    )
})


/**
 * 
 * @param param0 e = accepts change event of input element
 * @param param1 handleChange = accepts the onChange handler
 * @param param2 includs = accepts an array of characters that need to be include
 * @param param3 formatting = accepts boolean, if true than if will return "1,000" else "1000"
 *                      number formatting can only be possible if the include array is empty
 */
const numFrmt = new Intl.NumberFormat();
export const filterNumber = ({ e, handleChange, include = [], formating = false }: {
    e: React.ChangeEvent<HTMLInputElement>, handleChange: (e: React.ChangeEvent) => void, include?: string[], formating?: boolean,
}) => {
    const filterChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ...include];

    let value: number | string = e.target.value.split('').filter((chr) => filterChars.includes(chr)).join('');

    if (formating) {
        const _num = Number(value);
        if (isNaN(_num)) { value = _num }
        else { value = numFrmt.format(_num) }
    }

    e.target.value = value.toString();
    handleChange(e)
}


export interface FieldInterface {
    id?: string;
    name: string;
    type: "its-number" | "button" | "confirmation-checkbox" | "color" | "date" | "datetime-local" | "text-area" | "email" | "hidden" | "image" | "month" | "number" | "semi-number" | "password" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week";
    label: ReactNode
    notRequired?: boolean;
    value?: string; // default value
    // fieldArea?: ConditionalValue<string & { }> | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12)[]
    fieldArea?: GridItemProps['colSpan']
    /**
    * the key fieldName in condition is the name of the field which in present in the formik form
        and its value will be used to check with field name, if they both matches the field will be visible.
    */
    // condition: {[fieldName: string]: string }
    condition?: { fieldName: string, value: string[] }
    /** chakra InputProps */
    inputProps?: any,
}

// export interface ConfirmationCheckBoxFieldInterface extends Omit<FieldInterface, 'type'> {
//     type: "confirmation-checkbox"
// }

export interface ArrayFieldInterface extends Omit<FieldInterface, 'type' | 'label'> {
    type: "array-field"
    /**
     * only works if "type" is "array-field"
     */
    fieldArrayGroup: CombineFieldInterface[];
    /**
     * This field is used for main label of the array fieldgroup
     */
    label: ReactNode
    /**
     * this field is used as array item's label
     */
    itemLabel: ReactNode | ((p: { index: number }) => ReactNode)
    /**
     * this field is used as label for adding new item for eg: "+Add New Item"
     */
    labelForAddNewItem?: ReactNode
}

export interface FieldGroupInterface extends Omit<FieldInterface, 'type' | 'label'> {
    type: "fieldGroup"
    /**
     * only works if "type" is "fieldGroup"
     */
    fieldGroup: CombineFieldInterface[];
    label: ReactNode
}

export interface SelectFieldInterface extends Omit<FieldInterface, 'type'> {
    type: "select" | "checkbox"
    /**
     * only works if "type" is "select" | "checkbox"
     */
    options: { value: string, label: string }[] | string[];
}

export interface RadioFieldInterface extends Omit<SelectFieldInterface, 'type'> {
    type: "radio"
    /**
     * only works if "type" is "radio"
     */
    alignVertical?: boolean
}

export interface FileFieldInterface extends Omit<FieldInterface, 'type'> {
    type: "file"
    /**
     * only works if "type" is "file"
     */
    description?: ReactNode
    multiple?: boolean
    accept: FileUploadRootProps['accept']
    showDropArea?: boolean
    maxFiles?: number
    maxFileSize?: number
}

export interface CustomFieldInputProps { label: string | ReactNode, name: string, onChange?: (v: any) => void, value?: any, notRequired?: boolean; scope: FormGenerator }
export interface CustomFieldInterface extends Omit<FieldInterface, 'type'> {
    type: "custom";
    /**
    * only works if "type" is "custom"
    */
    CustomField: (p: CustomFieldInputProps) => ReactNode
}

export interface TextNoteFieldInterface extends Omit<FieldInterface, 'type' | 'value'> {
    type: "text-note";
    /**
    * only works if "type" is "text-note"
    */
    element: ReactNode
}

export type CombineFieldInterface = FileFieldInterface | RadioFieldInterface | ArrayFieldInterface | TextNoteFieldInterface | CustomFieldInterface | FieldInterface | FieldGroupInterface | SelectFieldInterface


// Similarly, convert other components like FormRadioField, FormFileField, FormArrayField, etc.
function replaceNwithValue(str: string, values: (number | string)[]) {
    const regex = /\[n\]/g;
    return str.replace(regex, () => `[${values.shift()}]`);
}


/** 
 * Created for form fields. This hook can use to make the field visible or hide based on the condition
 * ## params
 * - (name: string) This represents the name of the field.
 * Example name can be like ("name", "personal.name", "members[1].name")
 * 
 * - (condition?: FileFieldInterface['condition']) This represents the condition
 * that the field should be visible or hidden based on the condition. It expects
 * fieldName and value. FieldName is of the field which we want to check that if
 * the field has the value in it. Once the field has the value which we have passed
 * in the condition object then based on it the visible state will be true or false.
 * 
 * - (callback?: (visible: boolean) => void) This will be called when the condition field will be changed.
 */
export function useIsVisible({ name, condition }: { name: string, condition?: FileFieldInterface['condition'] }, callback?: (visible: boolean) => void) {
    const [visible, setVisible] = useState(true);
    if (condition) {
        const numArr = name?.match(/[\d]/g);
        const condFieldName = numArr
            ? replaceNwithValue(condition.fieldName, numArr)
            : condition.fieldName;
        const [condField] = useField("form." + condFieldName);
        useEffect(() => {
            const isIncluded = condition.value.includes(condField.value);
            setVisible(isIncluded);
            callback?.(isIncluded)
        }, [condField.value]);
    }
    return visible;
}
