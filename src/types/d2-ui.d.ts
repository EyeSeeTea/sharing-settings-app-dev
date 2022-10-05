declare module "@dhis2/ui" {
    interface FieldState<FieldValue> {
        active?: boolean;
        blur: () => void;
        change: (value: FieldValue | undefined) => void;
        data?: any;
        dirty?: boolean;
        dirtySinceLastSubmit?: boolean;
        error?: any;
        focus: () => void;
        initial?: FieldValue;
        invalid?: boolean;
        length?: number;
        modified?: boolean;
        modifiedSinceLastSubmit?: boolean;
        name: string;
        pristine?: boolean;
        submitError?: any;
        submitFailed?: boolean;
        submitSucceeded?: boolean;
        submitting?: boolean;
        touched?: boolean;
        valid?: boolean;
        validating?: boolean;
        value?: FieldValue;
        visited?: boolean;
    }
    export type ButtonProps = {
        children?: ReactNode;
        className?: string;
        dataTest?: string;
        destructive?: any;
        disabled?: boolean;
        icon?: JSX.Element;
        initialFocus?: boolean;
        large?: any;
        name?: string;
        primary?: any;
        secondary?: any;
        small?: any;
        tabIndex?: string;
        toggled?: boolean;
        type?: "submit" | "reset" | "button";
        value?: string;
        onBlur?: (data: { value?: string; name?: string }, event: FocusEvent) => void;
        onClick?: (data: { value?: string; name?: string }, event: MouseEvent) => void;
        onFocus?: (data: { value?: string; name?: string }, event: FocusEvent) => void;
    };
    export type NoticeBoxProps = {
        children?: React.ReactNode;
        className?: string;
        dataTest?: string;
        error?: boolean;
        title?: string;
        warning?: boolean;
    };

    export type TransferOption = {
        label: string;
        value: string;
        disabled?: boolean;
    };

    export type TransferProps = {
        options: TransferOption[];
        onChange: (params: { selected: string[] }) => void;
        addAllText?: string;
        addIndividualText?: string;
        className?: string;
        dataTest?: string;
        disabled?: boolean;
        enableOrderChange?: boolean;
        filterCallback?: (...args: any[]) => any;
        filterCallbackPicked?: (...args: any[]) => any;
        filterLabel?: string;
        filterLabelPicked?: string;
        filterPlaceholder?: string;
        filterPlaceholderPicked?: string;
        filterable?: boolean;
        filterablePicked?: boolean;
        height?: string;
        hideFilterInput?: boolean;
        hideFilterInputPicked?: boolean;
        initialSearchTerm?: string;
        initialSearchTermPicked?: string;
        leftFooter?: React.ReactNode;
        leftHeader?: React.ReactNode;
        loading?: boolean;
        loadingPicked?: boolean;
        maxSelections?: any;
        optionsWidth?: string;
        removeAllText?: string;
        removeIndividualText?: string;
        renderOption?: (...args: any[]) => any;
        rightFooter?: React.ReactNode;
        rightHeader?: React.ReactNode;
        searchTerm?: string;
        searchTermPicked?: string;
        selected?: string[];
        selectedEmptyComponent?: React.ReactNode;
        selectedWidth?: string;
        sourceEmptyPlaceholder?: React.ReactNode;
        onEndReached?: (...args: any[]) => any;
        onEndReachedPicked?: (...args: any[]) => any;
        onFilterChange?: (...args: any[]) => any;
        onFilterChangePicked?: (...args: any[]) => any;
    };
    export function Button(props: ButtonProps): React.ReactElement;
    export function NoticeBox(props: NoticeBoxProps): React.ReactElement;
    export function Transfer(props: TransferProps): React.ReactElement;
    export function HeaderBar(props: { className?: string; appName?: string }): React.ReactElement;





}
