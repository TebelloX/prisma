import chalk from 'chalk'
import prompt from 'prompts'
import { isCi } from '@prisma/sdk'
import { MigrationFeedback } from '../types'
import { MigrateDevEnvNonInteractiveError } from './errors'

export function handleUnexecutableSteps(
  unexecutableSteps: MigrationFeedback[],
  createOnly = false,
) {
  if (unexecutableSteps && unexecutableSteps.length > 0) {
    const messages: string[] = []
    messages.push(
      `${chalk.bold.red('\n⚠️ We found changes that cannot be executed:\n')}`,
    )
    for (const item of unexecutableSteps) {
      messages.push(`${chalk(`  • Step ${item.stepIndex} ${item.message}`)}`)
    }
    console.info() // empty line

    // If create only, allow to continue
    if (createOnly) {
      console.error(`${messages.join('\n')}\n`)
    } else {
      throw new Error(`${messages.join('\n')}\n`)
    }
  }
}

export async function handleWarnings(
  warnings: MigrationFeedback[],
  force = false,
): Promise<boolean | void> {
  if (warnings && warnings.length > 0) {
    console.log(
      chalk.bold(
        `\n⚠️  There will be data loss when applying the migration:\n`,
      ),
    )
    for (const warning of warnings) {
      console.log(chalk(`  • ${warning.message}`))
    }
    console.info() // empty line

    if (!force) {
      // We use prompts.inject() for testing in our CI
      if (isCi() && Boolean((prompt as any)._injected?.length) === false) {
        throw new MigrateDevEnvNonInteractiveError()
      } else {
        const confirmation = await prompt({
          type: 'confirm',
          name: 'value',
          message: `Are you sure you want create and apply this migration? ${chalk.red(
            'Some data will be lost',
          )}.`,
        })

        if (!confirmation.value) {
          return true
        }
      }
    }

    return false
  }
}
