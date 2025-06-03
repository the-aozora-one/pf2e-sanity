(async () => {
    // Do nothing if no tokens are selected
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.error("Please select at least one token.")
        return
    }

    // Do we want to damage sanity or heal it
    const sanityAction = await Dialog.wait({
        title: 'Sanity Control',
        content: 'What would you like to do to the selected character\'s sanity?',
        buttons: {
            damage: {
                label: 'Damage',
                callback: () => {
                    return 'damage'
                },
            },
            heal: {
                label: 'Heal',
                callback: () => {
                    return 'heal'
                }
            },
            cancel: {
                label: 'Cancel',
                callback: () => {
                    return 'cancel'
                }
            }
        }
    })
    if (sanityAction === 'cancel') {
        return
    }

    const formContent = await renderTemplate(`modules/pf2e-sanity/dist/templates/form/sanity-points-value.hbs`, {})
    const formResponse = await Dialog.wait({
        title: "Sanity Control",
        content: formContent,
        buttons: {
            submit: {
                label: 'Submit',
                callback: (html) => {
                    const formElement = html[0].querySelector('form')
                    return new FormDataExtended(formElement)
                }
            },
            cancel: {
                label: 'Cancel',
                callback: () => {
                    return 'cancel'
                }
            }
        }
    })
    if (formResponse === 'cancel') {
        return
    }

    const sanityPoints = formResponse.object.sanityPoints
    for (const token of canvas.tokens.controlled) {
        const actor = token.actor
        const newSanityValue  = sanityAction === 'heal'
            ? Math.min(10, actor.getResource('sanity').value + sanityPoints)
            : Math.max(0, actor.getResource('sanity').value - sanityPoints)

        actor.updateResource('sanity', newSanityValue)
    }
})()