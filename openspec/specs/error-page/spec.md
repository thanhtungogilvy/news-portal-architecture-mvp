### Requirement: app/error.vue renders a user-facing error page for all unhandled client errors
The `app/error.vue` component SHALL receive the Nuxt `error` prop and render a recovery UI. It SHALL display a title and message appropriate to `error.statusCode`, and provide a button to clear the error and navigate home.

#### Scenario: 404 error displays not-found message
- **WHEN** Nuxt catches an error with `statusCode === 404`
- **THEN** `app/error.vue` SHALL display a "Page not found" title and offer a "Go home" navigation link

#### Scenario: 500 and other errors display generic message
- **WHEN** Nuxt catches an error with a `statusCode` other than 404
- **THEN** `app/error.vue` SHALL display a generic "Something went wrong" title and offer a "Go home" navigation link

#### Scenario: Clearing the error navigates to home
- **WHEN** the user clicks the recovery button
- **THEN** `clearError({ redirect: '/' })` SHALL be called and the user SHALL be navigated to the home page
