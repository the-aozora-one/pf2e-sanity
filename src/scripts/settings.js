import { MODULE_ID } from "./global";

export function registerSettings() {
    game.settings.register(MODULE_ID, 'maximum-sanity', {
        name: `${MODULE_ID}.maximum-sanity`,
        hint: `${MODULE_ID}.maximum-sanity-hint`,
        scope: 'world',
        config: true,
        type: new foundry.data.fields.NumberField(),
        default: 10,
        onChange: (value) => {
            console.debug(MODULE_ID, "|", "Maximum Sanity", value)
        },
        requiresReload: false,
    })
}