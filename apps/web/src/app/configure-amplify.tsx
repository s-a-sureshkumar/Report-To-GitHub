'use client'

import { Amplify } from 'aws-amplify'

import outputs from '@report/core-service/amplify_outputs.json'

Amplify.configure(outputs, { ssr: true })

export function ConfigureAmplifyClientSide() {
  return null
}
