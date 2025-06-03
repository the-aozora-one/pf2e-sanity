import { MODULE_ID } from "./scripts/global"
import { registerSettings } from "./scripts/settings"

import './styles/module.scss'

Hooks.on('init', () => {
    registerSettings()
})

Hooks.on('ready', () => {
    $(document).on('click', '[data-action="sanity-heal"]', async function(event) {
        // Heal sanity for the token
        const actor = _token?.actor
        if (!actor) {
            // Alert the user that they need to select a token
            ui.notifications.error("Select a token first.")
            return
        }

        const currentSanity = actor.getResource('sanity').value
        if (currentSanity === 10) {
            ui.notifications.warn("The selected token is already at maximum sanity.")
            return
        }

        // Calculate the token's new sanity
        const newSanityValue = Math.min(10, actor.getResource('sanity').value + 1)
        actor.updateResource('sanity', newSanityValue)

        // Create the message content
        const templateData = {
            actor: actor,
            sanity: newSanityValue,
        }
        const messageContent = await renderTemplate(`modules/${MODULE_ID}/dist/templates/chat-message/sanity-increase/sanity-healed.hbs`, templateData)

        // Only show the sanity damage message to actor owners
        const owners = Object.keys(actor.ownership).filter((key) => {
            return actor.ownership[key] == CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        })

        // Create the ChatMessage
        await ChatMessage.create({
            author: game.user.id,
            content: messageContent,
            speaker: ChatMessage.getSpeaker({ _token, actor, user: game.user}),
            whispers: owners,
            flags: {
                "pf2e-sanity-damage": true,
            }
        })
    }).on('click', '[data-action="revert-sanity-heal"]', async function(event) {
        // Revert sanity healing for the actor

        // Get the chat message for this button
        const elementParents = $(event.currentTarget).parents('.chat-message')
        if (elementParents.length === 0) {
            return
        }

        const chatMessageElement = elementParents[0]
        if (!chatMessageElement) {
            return
        }

        // Get the ChatMessage with the matching message ID
        const messageId = $(chatMessageElement).attr('data-message-id')
        const message = ChatMessage.get(messageId)
        if (!message) {
            return
        }

        // Get the actor for this message or the currently selected token
        const actor = game.actors.get(message.speaker.actor) ?? _token.actor
        if (!actor) {
            return
        }

        // Add one sanity point to the actor
        const newSanityValue = actor.getResource('sanity').value - 1
        actor.updateResource('sanity', newSanityValue)

        // Cross out the text in the message and remove the button
        chatMessageElement.querySelector('span.statements')?.classList.add('reverted')
        chatMessageElement.querySelector('button.revert-sanity-heal')?.remove()
    })
})

Hooks.on('applyTokenStatusEffect', async (token, effectString, isEffectNowActive) => {
    if (effectString === 'dead') {
        if (isEffectNowActive) {
            const actor = game.actors.get(token.document.actorId)
            const templateData = {
                targetName: token.document.name,
            }
            const messageContent = await renderTemplate(`modules/${MODULE_ID}/dist/templates/chat-message/sanity-increase/enemy-killed.hbs`, templateData)

            // Create the ChatMessage
            await ChatMessage.create({
                author: game.user.id,
                content: messageContent,
                speaker: ChatMessage.getSpeaker({ _token, actor, user: game.user}),
                flags: {
                    "pf2e-sanity-heal": true,
                },
            })
        }
    }
})