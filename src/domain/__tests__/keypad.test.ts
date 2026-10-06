import { describe, expect, it } from 'vitest'
import { applyKey, keypadKeyFromKeyboard, type KeypadKey } from '../keypad'

const type = (keys: KeypadKey[], start = '') => keys.reduce((text, key) => applyKey(text, key), start)

describe('applyKey', () => {
  it('types digits and one comma', () => {
    expect(type(['1', '3', '0'])).toBe('130')
    expect(type(['1', '2', ',', '5', ','])).toBe('12,5')
  })

  it('comma first gives "0,"; leading zero is replaced', () => {
    expect(type([',', '5'])).toBe('0,5')
    expect(type(['0', '7'])).toBe('7')
  })

  it('one decimal digit, five integer digits', () => {
    expect(type(['1', ',', '2', '3'])).toBe('1,2')
    expect(type(['1', '2', '3', '4', '5', '6'])).toBe('12345')
  })

  it('backspace and clear', () => {
    expect(applyKey('12,5', 'back')).toBe('12,')
    expect(applyKey('1', 'back')).toBe('')
    expect(applyKey('', 'back')).toBe('')
    expect(applyKey('130', 'clear')).toBe('')
  })

  it('a freshly activated row is replaced by the first key, like a calculator', () => {
    expect(applyKey('130', '1', true)).toBe('1')
    expect(applyKey('130', ',', true)).toBe('0,')
    expect(applyKey('130', 'back', true)).toBe('')
  })
})

describe('keypadKeyFromKeyboard', () => {
  it('maps digits, both decimal points, editing keys', () => {
    expect(keypadKeyFromKeyboard('7')).toBe('7')
    expect(keypadKeyFromKeyboard('.')).toBe(',')
    expect(keypadKeyFromKeyboard(',')).toBe(',')
    expect(keypadKeyFromKeyboard('Backspace')).toBe('back')
    expect(keypadKeyFromKeyboard('Escape')).toBe('clear')
    expect(keypadKeyFromKeyboard('a')).toBeNull()
    expect(keypadKeyFromKeyboard('Enter')).toBeNull()
  })
})
