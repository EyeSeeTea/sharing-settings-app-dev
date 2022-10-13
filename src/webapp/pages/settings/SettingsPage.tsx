import i18n from "@dhis2/d2-i18n";
import _ from "lodash";
import { TableAction, RowConfig, ObjectsTable, TableState, useSnackbar } from "@eyeseetea/d2-ui-components";
import { Button } from "@dhis2/ui";
import React, { useCallback, useState, useMemo, useEffect } from "react";
import { PageHeader } from "../../components/page-header/PageHeader";
import { useGoBack } from "../../hooks/useGoBack";
import { useAppContext } from "../../contexts/app-context";
import { ListMetadataResponse, ListOptions } from "../../../domain/repositories/MetadataRepository";
import { displayName, MetadataItem, MetadataModel } from "../../../domain/entities/MetadataItem";
import Dropdown, { DropdownOption } from "../../components/dropdown/Dropdown";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";
import AddCircleOutlineIcon from "@material-ui/icons/AddCircleOutline";

export const SettingsPage: React.FC = () => {
    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();
    const goBack = useGoBack();
    const [builder, updateBuilder] = useState<Builder>(defaultBuilder);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<ListMetadataResponse>(initialResponse);
    const [listOptions, setListOptions] = useState<ListOptions>(initialState);

    const columns = useMemo(
        () => [
            { name: "name", text: i18n.t("Name"), sortable: true },
            { name: "id", text: i18n.t("ID"), sortable: true },
            {
                name: "model",
                text: i18n.t("Metadata Type"),
                sortable: false,
                getValue: (row: MetadataItem) => compositionRoot.metadata.getModelName(String(row.model)),
            },
            { name: "publicAccess", text: i18n.t("Public Access"), sortable: true },
            { name: "userAccesses", text: i18n.t("Users"), sortable: true },
            { name: "userGroupAccesses", text: i18n.t("User Groups"), sortable: true },
        ],
        [compositionRoot.metadata]
    );

    const actions = useMemo(
        (): TableAction<MetadataItem>[] => [
            {
                name: "exclude",
                text: i18n.t("Exclude dependency"),
                multiple: true,
                icon: <RemoveCircleOutlineIcon />,
                isActive: (rows: MetadataItem[]) => _.some(rows, row => !builder.excludedDependencies.includes(row.id)),
                onClick: (selection: string[]) => {
                    updateBuilder(builder => ({
                        ...builder,
                        excludedDependencies: _.uniq([...builder.excludedDependencies, ...selection]),
                    }));
                },
            },
            {
                name: "include",
                text: i18n.t("Include dependency"),
                multiple: true,
                icon: <AddCircleOutlineIcon />,
                isActive: (rows: MetadataItem[]) => _.every(rows, row => builder.excludedDependencies.includes(row.id)),
                onClick: (selection: string[]) => {
                    updateBuilder(builder => ({
                        ...builder,
                        includedDependencies: _.uniq([...builder.includedDependencies, ...selection]),
                        excludedDependencies: _.difference(builder.excludedDependencies, selection),
                    }));
                },
            },
        ],
        [builder.excludedDependencies]
    );

    const selection = useMemo(() => {
        return builder.baseElements.map(id => ({ id }));
    }, [builder]);

    useEffect(() => {
        setIsLoading(true);

        compositionRoot.metadata.list(listOptions).run(
            data => {
                const rows = data.objects.map((item: MetadataItem) => ({
                    ...item,
                    model: listOptions.model,
                }));
                setResponse({ objects: rows, pager: data.pager });
                setIsLoading(false);
            },
            error => snackbar.error(error)
        );
    }, [compositionRoot, snackbar, listOptions]);

    useEffect(() => {
        compositionRoot.excludedDependencies.list().run(
            data => {
                const plainIds = data.map(({ id }) => id);
                updateBuilder(builder => ({ ...builder, excludedDependencies: plainIds }));
            },
            error => snackbar.error(error)
        );
    }, [compositionRoot.excludedDependencies, snackbar]);

    const onTableChange = useCallback(
        async ({ pagination, sorting, selection }: TableState<MetadataItem>) => {
            updateBuilder(builder => ({ ...builder, baseElements: selection.map(({ id }) => id) }));
            setListOptions(options => ({
                ...options,
                pageSize: pagination.pageSize,
                page: pagination.page,
                sorting: { field: String(sorting.field), order: sorting.order },
            }));
        },
        [updateBuilder]
    );

    const saveExcludedDependencies = async () => {
        try {
            await compositionRoot.excludedDependencies.save(builder.excludedDependencies).toPromise();
            await builder.includedDependencies.map(selected =>
                compositionRoot.excludedDependencies.delete(selected).toPromise()
            );
            snackbar.success("Successfully saved global excluded dependencies!");
        } catch (error) {
            //@ts-ignore
            snackbar.error(error);
        }
    };

    const filterComponents = (
        <Dropdown<MetadataModel>
            items={filterModels}
            onValueChange={model => setListOptions(options => ({ ...options, model }))}
            value={listOptions.model}
            label={i18n.t("Metadata type")}
            hideEmpty={true}
        />
    );

    const rowConfig = useCallback(
        (row: MetadataItem): RowConfig => {
            const isExcluded = builder.excludedDependencies.includes(row.id);
            return isExcluded ? { style: { backgroundColor: "#ffcdd2" } } : {};
        },
        [builder]
    );

    return (
        <React.Fragment>
            <PageHeader title={i18n.t("Global exclusion settings")} onBackClick={goBack} />
            <ObjectsTable<MetadataItem>
                rows={response.objects}
                columns={columns}
                onChange={onTableChange}
                pagination={response.pager}
                sorting={{ field: "displayName", order: "asc" }}
                loading={isLoading}
                initialState={initialState}
                forceSelectionColumn={true}
                filterComponents={filterComponents}
                onChangeSearch={search => setListOptions(options => ({ ...options, search }))}
                searchBoxLabel={i18n.t("Search by name")}
                actions={actions}
                rowConfig={rowConfig}
                selection={selection}
            />
            <Button type="submit" onClick={saveExcludedDependencies} primary>
                {i18n.t("Save global excluded dependencies")}
            </Button>
        </React.Fragment>
    );
};

interface Builder {
    baseElements: string[];
    excludedDependencies: string[];
    includedDependencies: string[];
}

const initialState: ListOptions = {
    model: "dashboards",
    sorting: { field: "name", order: "asc" },
    pageSize: 10,
};

const initialResponse: ListMetadataResponse = {
    objects: [],
    pager: { pageSize: 10, page: 1, total: 0 },
};

const filterModels: DropdownOption<MetadataModel>[] = Object.entries(displayName)
    .map(([id, name]) => ({
        id: id as MetadataModel,
        name,
    }))
    .sort((a, b) => (a.id > b.id ? 1 : b.id > a.id ? -1 : 0));

const defaultBuilder: Builder = {
    baseElements: [],
    excludedDependencies: [],
    includedDependencies: [],
};
