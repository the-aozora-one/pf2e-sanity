# PF2E Sanity

A Foundry VTT module for adding a sanity resource to creatures.

## Installation

Install the module from the Add-on Modules screen in the FoundryVTT setup

## Usage

Open the Compendium pack for the module and drag the bonus feat Sanity onto any character you want to be affected by the module.
This item adds a special resource of Sanity Points that will show up on the character sheet.

### Automation

Anytime that character has damage rolled against them, a button to take sanity damage will also be added to the message.
Clicking the button will deduct a single sanity point from the character.
A message indicating the character's new sanity points will be posted to chat and will have a button to revert the damage like normal damage messages for the system.

Anytime an enemy is killed, a message with a button to increase sanity will be created.
Clicking the button will increase the character's sanity by one point up to the max.
A message to revert the sanity healing will also be created.

## Development

```
mklink /d C:/foundry/module/path C:/development/path
```
