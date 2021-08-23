import React, { useMemo } from "react";
import { Wizard, WizardStep } from "@eyeseetea/d2-ui-components";
import { useLocation } from "react-router-dom";
import _ from "lodash";

import { MetadataSharingWizardStepProps, metadataSharingWizardSteps } from "./steps";

export interface MetadataSharingWizardProps extends MetadataSharingWizardStepProps {
    className?: string;
}

export const SharingWizard: React.FC<MetadataSharingWizardStepProps> = props => {
    const location = useLocation();

    const steps = useMemo(() => metadataSharingWizardSteps.map(step => ({ ...step, props })), [props]);

    const onStepChangeRequest = async (_prev: WizardStep) => {
        return undefined;
    };

    /* const onStepChangeRequest = async (_currentStep: WizardStep, newStep: WizardStep) => {
        const index = _(steps).findIndex(step => step.key === newStep.key);
        const validationMessages = _.take(steps, index).map(({ validationKeys }) =>
            getValidationMessages(syncRule, validationKeys)
        );

        return _.flatten(validationMessages);
    };*/
    /* const steps = metadataSharingWizardSteps.map(step => ({
        ...step,
        props: {
            onCancel: () => console.log("User wants to cancel the wizard!"),
        },
    }));*/

    const urlHash = location.hash.slice(1);
    const stepExists = steps.find(step => step.key === urlHash);
    const firstStepKey = steps.map(step => step.key)[0];
    const initialStepKey = stepExists ? urlHash : firstStepKey;

    return (
        <Wizard
            useSnackFeedback={true}
            onStepChangeRequest={onStepChangeRequest}
            initialStepKey={initialStepKey}
            lastClickableStepIndex={steps.length - 1}
            steps={steps}
        />
    );
};
