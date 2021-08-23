import { HashRouter, Route, Switch } from "react-router-dom";
import { ExamplePage } from "./example/ExamplePage";
import { LandingPage } from "./landing/LandingPage";
import { BulkApply } from "./bulkApply/BulkApply";

export const Router = () => {
    return (
        <HashRouter>
            <Switch>
                <Route path="/apply" render={() => <BulkApply />} />
                <Route
                    path="/for/:name?"
                    render={({ match }) => <ExamplePage name={match.params.name ?? "Stranger"} />}
                />

                {/* Default route */}
                <Route render={() => <LandingPage />} />
            </Switch>
        </HashRouter>
    );
};
