import * as core from '@actions/core'
import fs from 'fs'
import { Annotation } from './types'
import { closeStatusCheck, createStatusCheck, updateStatusCheck } from './statusCheck'

function toGithubSeverity(severity: string) {
  return severity == 'ERROR'? 'failure' : 'warning'
}

function readShphixLogFile(path: string): Array<Annotation> {
  let annotations: Array<Annotation> = []
  core.debug(path)
  const data = fs.readFileSync(path, 'utf8')
  const lines = data.split('\n')
  let regexp: RegExp = /(.+):(\d+):\s*(WARNING|ERROR):\s*(.*)\s*/
  lines.forEach(line => {
    let match = line.match(regexp)
    if (match) {
      annotations.push({
        path: match[1],
        line: +match[2],
        severity: toGithubSeverity(match[3]),
        message: match[4]
      })
    }
  })
  return annotations
}

export async function run(): Promise<void> {
  const checkName = core.getInput('name')
  const path: string = core.getInput('path')
  const githubToken: string = core.getInput('github-token')

  try {
    const annotations = readShphixLogFile(path)
    annotations.forEach(annotation => {
      core.debug(
        `!${annotation.path}, ${annotation.line}, ${annotation.severity}, ${annotation.message}`
      )
    })

    let checkId = 0;
    if(githubToken) {
      checkId = await createStatusCheck(githubToken, checkName)
        .catch(() => {
          throw new Error('There has been an issue creating the status check. Does the action have the right permissions?')
        })

      await updateStatusCheck(
          githubToken,
          checkId,
          checkName,
          annotations
        )

      let shouldFail: boolean = (annotations.map(ann => ann.severity).find(s => s == "failure") != undefined);

      await closeStatusCheck(githubToken, {
          checkId,
          checkName: checkName,
          createSummary: false,
          shouldFail: shouldFail
        })
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
