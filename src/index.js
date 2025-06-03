import { MODULE_ID } from "./scripts/global"
import { registerSettings } from "./scripts/settings"

import './styles/module.scss'

CONFIG.debug.hooks = true

console.debug(MODULE_ID, "|", "Registering")
Hooks.on('init', () => {
    registerSettings()
})

Hooks.on('ready', () => {
    console.info(MODULE_ID, "|", "Ready")

    $(document).on('click', '[data-action="sanity-drain"]', async function() {
        // Apply sanity damage to the token
        const actor = _token?.actor
        if (!actor) {
            console.debug(MODULE_ID, "|", "Actor", actor)
            // Alert the user that they need to select a token
            return
        }

        // Calculate the token's new sanity
        const newSanityValue = Math.max(0, actor.getResource('sanity').value - 1)
        console.debug(MODULE_ID, "|", "Sanity", {
            new: newSanityValue,
            old: actor.getResource('sanity')
        })
        actor.updateResource('sanity', newSanityValue)

        // Create the message content
        const templateData = {
            actor: actor,
            sanity: newSanityValue,
        }
        const messageContent = await renderTemplate(`modules/${MODULE_ID}/dist/templates/chat-message/sanity-drain/damage-taken.hbs`, templateData)

        // Only show the sanity damage message to actor owners
        const owners = Object.keys(actor.ownership).filter((key) => {
            console.debug(MODULE_ID, "|", "Ownership", {
                level: actor.ownership[key],
                user: key,
            })
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
    }).on('click', '[data-action="revert-sanity-damage"]', async function(event) {
        // Revert sanity damage for the actor

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
        const newSanityValue = actor.getResource('sanity').value + 1
        actor.updateResource('sanity', newSanityValue)

        // Cross out the text in the message and remove the button
        chatMessageElement.querySelector('span.statements')?.classList.add('reverted')
        chatMessageElement.querySelector('button.revert-sanity-damage')?.remove()
    }).on('click', '[data-action="sanity-heal"]', async function(event) {
        // Heal sanity for the token
        const actor = _token?.actor
        if (!actor) {
            console.debug(MODULE_ID, "|", "Actor", actor)
            // Alert the user that they need to select a token
            return
        }

        // Calculate the token's new sanity
        const newSanityValue = Math.min(10, actor.getResource('sanity').value + 1)
        console.debug(MODULE_ID, "|", "Sanity", {
            new: newSanityValue,
            old: actor.getResource('sanity')
        })
        actor.updateResource('sanity', newSanityValue)

        // Create the message content
        const templateData = {
            actor: actor,
            sanity: newSanityValue,
        }
        const messageContent = await renderTemplate(`modules/${MODULE_ID}/dist/templates/chat-message/sanity-increase/sanity-healed.hbs`, templateData)

        // Only show the sanity damage message to actor owners
        const owners = Object.keys(actor.ownership).filter((key) => {
            console.debug(MODULE_ID, "|", "Ownership", {
                level: actor.ownership[key],
                user: key,
            })
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

Hooks.on("renderChatMessage", async (message, html, _data) => {
    const ACTIONS_DRAINING_SANITY = [
        'damage-roll',
    ]
    // Add a button to drain sanity under to all damage rolls
    if (
        ACTIONS_DRAINING_SANITY.includes(message?.flags?.pf2e?.context?.type)
        && !message?.flags?.pf2e?.context?.domains?.includes('healing')
        && html.length > 0
    ) {
        console.debug(MODULE_ID, "|", "Showing Sanity Drain Button")
        // Get the ChatMessage
        const chatMessage = html[0]
        if (!chatMessage) {
            return
        }

        // Get the content of the message
        const messageContent = chatMessage.children[1]
        if (!messageContent) {
            return
        }

        // Add the button for draining sanity
        messageContent.innerHTML += `<button type="button" data-action="sanity-drain" title="[Click] Apply sanity drain to selected tokens"><i class="fa-solid fa-brain fa-fw"></i><span class="label">Sanity Damage</span></button>`
    }
})

Hooks.on('applyTokenStatusEffect', async (token, effectString, isEffectNowActive) => {
    if (effectString === 'dead' && isEffectNowActive) {
        if (token?.document?.actors?.size === 0) {
            return
        }

        console.debug(MODULE_ID, "|", "Actors", token.document.actors)

        const actor = token.document.actors.get(0)
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
})