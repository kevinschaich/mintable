# Adding an integration

You need to create:

* A `src/integrations/<YOUR INTEGRATION NAME>` folder
    * A `setup.ts` script which bootstraps any necessary config, and facilitates authentication & key exchange (if necessary)
    * A `<YOUR INTEGRATION NAME>Integration.ts` file which contains a `<YOUR INTEGRATION NAME>Integration` Class, with a constructor and public methods
* Create a `<YOUR INTEGRATION NAME>Config` interface which extends `BaseIntegrationConfig` in `src/types/integrations.ts`
  * Add your integration to the available `IntegrationId` enum, and add your `<YOUR INTEGRATION NAME>Config` as a union type of `IntegrationConfig`

See `src/integrations/plaid` for an example.
