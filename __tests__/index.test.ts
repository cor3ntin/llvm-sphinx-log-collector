/**
 * Unit tests for the action's entrypoint, src/index.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as index from '../src/index'

// Mock the GitHub Actions core library
const getInputMock = jest.spyOn(core, 'getInput')
// Mock the action's entrypoint
const runMock = jest.spyOn(index, 'run')

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('works', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'path':
          return `${__dirname}/test.txt`
        default:
          return ''
      }
    })

    await index.run()
    expect(runMock).toHaveReturned()
  })
})
