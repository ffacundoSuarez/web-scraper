import { useState, useEffect, useCallback } from 'react'
import type { ListExtractionData, ScrapeState, ScraperType } from '@/core/types'
import { sendMessage } from '@/core/messaging'
import {
  getState,
  onStateChange,
  clearState,
  defaultState,
  getListData,
  onListDataChange,
  defaultListData,
  clearListData,
} from '@/core/storage'

/**
 * Hook de React que gestiona el estado del scraper.
 */
export function useScraper() {
  const [state, setState] = useState<ScrapeState>(defaultState)
  const [listData, setListData] = useState<ListExtractionData>(defaultListData)
  const [currentUrl, setCurrentUrl] = useState('')
  const [selectorActive, setSelectorActive] = useState(false)
  const [listDetectorActive, setListDetectorActive] = useState(false)

  useEffect(() => {
    void getState().then(setState)
    void getListData().then(setListData)
    const unsubState = onStateChange(setState)
    const unsubList = onListDataChange(setListData)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) setCurrentUrl(tabs[0].url)
    })
    return () => {
      unsubState()
      unsubList()
    }
  }, [])

  const startScrape = useCallback(async () => {
    const types: ScraperType[] = [
      'emails',
      'phones',
      'links',
      'images',
      'text',
      'tables',
      'reviews',
      'business',
      'social',
    ]
    await sendMessage('START_SCRAPE', { types, url: currentUrl })
  }, [currentUrl])

  const toggleSelector = useCallback(async () => {
    if (selectorActive) {
      await sendMessage('STOP_SELECTOR')
      setSelectorActive(false)
    } else {
      if (listDetectorActive) {
        await sendMessage('STOP_LIST_DETECTOR')
        setListDetectorActive(false)
      }
      await sendMessage('START_SELECTOR')
      setSelectorActive(true)
    }
  }, [selectorActive, listDetectorActive])

  const toggleListDetector = useCallback(async () => {
    if (listDetectorActive) {
      await sendMessage('STOP_LIST_DETECTOR')
      setListDetectorActive(false)
    } else {
      if (selectorActive) {
        await sendMessage('STOP_SELECTOR')
        setSelectorActive(false)
      }
      await sendMessage('START_LIST_DETECTOR')
      setListDetectorActive(true)
    }
  }, [listDetectorActive, selectorActive])

  const startPagination = useCallback(async () => {
    await sendMessage('START_PAGINATION')
  }, [])

  const openDataTable = useCallback(() => {
    const url = chrome.runtime.getURL('src/datatable/index.html')
    void chrome.tabs.create({ url })
  }, [])

  const clearData = useCallback(async () => {
    await clearState()
    await clearListData()
    setState(defaultState)
    setListData(defaultListData)
  }, [])

  return {
    state,
    listData,
    currentUrl,
    selectorActive,
    listDetectorActive,
    startScrape,
    toggleSelector,
    toggleListDetector,
    startPagination,
    openDataTable,
    clearData,
  }
}
