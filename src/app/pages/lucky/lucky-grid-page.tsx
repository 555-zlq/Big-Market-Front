"use client"

import React, { useState, useRef, useEffect } from "react"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { LuckyGrid } from "@lucky-canvas/react"
import { queryRaffleAwardList, randomRaffle } from "@/apis"
import { RaffleAwardVO } from "@/types/RaffleAwardVO"
import { useSearchParams } from "next/navigation"

type LuckyGridRef = {
    play: () => void
    stop: (index: number) => void
}

type LuckyGridPrize = {
    x: number
    y: number
    background: string
    fonts: { id: number | string; text: string; top: string }[]
}

export function LuckyGridPage() {
    const searchParams = useSearchParams()
    const strategyId = Number(searchParams.get("strategyId"))

    const myLucky = useRef<LuckyGridRef | null>(null)
    const [prizes, setPrizes] = useState<LuckyGridPrize[]>([])
    const [isSpinning, setIsSpinning] = useState(false)

    const blocks = [{ padding: "10px", background: "#869cfa" }]
    const buttons = [
        { x: 1, y: 1, background: "#7f95d1", fonts: [{ text: "开始", top: "35%" }] },
    ]
    const defaultStyle = [{ background: "#b8c5f2" }]

    /** 🧩 获取奖品列表并生成 8 宫格 */
    const queryRaffleAwardListHandle = async () => {
        if (!strategyId) return
        try {
            const res = await queryRaffleAwardList(strategyId)
            const { code, info, data }: { code: string; info: string; data: RaffleAwardVO[] } = await res.json()

            if (code !== "0000") {
                alert(`获取抽奖列表失败：${info}（code: ${code}）`)
                return
            }

            // LuckyGrid 为 3x3，8 个奖品位置如下：
            const positionMap = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 2, y: 1 },
                { x: 2, y: 2 },
                { x: 1, y: 2 },
                { x: 0, y: 2 },
                { x: 0, y: 1 },
            ]

            const newPrizes: LuckyGridPrize[] = data.slice(0, 8).map((award, idx) => ({
                ...positionMap[idx],
                background: idx % 2 === 0 ? "#e9e8fe" : "#b8c5f2",
                fonts: [{ id: award.awardId, text: award.awardTitle, top: "50%", fontSize: "14px", lineHeight: "1.2", wordWrap: true,}],
            }))

            setPrizes(newPrizes)
        } catch (err) {
            console.error("❌ 奖品列表请求失败：", err)
            alert("请求奖品列表时出现错误")
        }
    }

    /** 🎯 抽奖逻辑 */
    const randomRaffleHandle = async (): Promise<number | undefined> => {
        if (!strategyId) return
        try {
            const res = await randomRaffle(strategyId)
            const { code, info, data }: { code: string; info: string; data: { awardIndex?: number; awardId?: number | string } } = await res.json()

            if (code !== "0000") {
                alert(`抽奖失败：${info}（code: ${code}）`)
                return
            }

            const idx = data.awardIndex ?? prizes.findIndex(p => p.fonts.some(f => f.id === data.awardId))
            return idx - 1
        } catch (err) {
            console.error("❌ 抽奖请求失败：", err)
            alert("请求抽奖接口时出现错误")
        }
    }

    /** 🔄 初始化奖品列表 */
    useEffect(() => {
        queryRaffleAwardListHandle()
    }, [strategyId])

    /** 🎡 渲染 LuckyGrid */
    return (
        <div className="flex flex-col items-center mt-8">
            <LuckyGrid
                ref={myLucky}
                width="300px"
                height="300px"
                rows={3}
                cols={3}
                prizes={prizes}
                blocks={blocks}
                buttons={buttons}
                defaultStyle={defaultStyle}
                onStart={() => {
                    if (isSpinning) return
                    setIsSpinning(true)
                    myLucky.current?.play()

                    setTimeout(() => {
                        randomRaffleHandle()
                            .then(index => {
                                if (index !== undefined) myLucky.current?.stop(index)
                            })
                            .catch(console.error)
                    }, 2500)
                }}
                onEnd={(prize: LuckyGridPrize) => {
                    const font = prize.fonts[0]
                    alert(`🎉 恭喜你抽到【${font.text}】（奖品ID：${font.id}）`)
                    setIsSpinning(false)
                }}
            />
        </div>
    )
}
