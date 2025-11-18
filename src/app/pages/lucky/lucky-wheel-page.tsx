"use client"

import React, { useState, useRef, useEffect } from "react"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { LuckyWheel, LuckyWheelProps } from "@lucky-canvas/react"
import { queryRaffleAwardList, draw } from "@/apis"
import { RaffleAwardVO } from "@/types/RaffleAwardVO"
import { useSearchParams } from "next/navigation"

type PrizeFont = {
    id: number | string
    text: string
    top: string
}

type Prize = {
    background: string
    fonts: PrizeFont[]
}

type LuckyWheelRef = {
    play: () => void
    stop: (index: number) => void
}

export function LuckyWheelPage() {
    const searchParams = useSearchParams()
    const activityId = Number(searchParams.get("activityId"))
    const userId = String(searchParams.get("userId"))
    const myLucky = useRef<LuckyWheelRef | null>(null)

    const [prizes, setPrizes] = useState<Prize[]>([])
    const [isSpinning, setIsSpinning] = useState(false)

    const blocks: LuckyWheelProps["blocks"] = [
        { padding: "10px", background: "#869cfa" },
    ]

    const buttons: LuckyWheelProps["buttons"] = [
        { radius: "40%", background: "#617df2" },
        { radius: "35%", background: "#afc8ff" },
        {
            radius: "30%",
            background: "#869cfa",
            pointer: true,
            fonts: [{ text: "开始", top: "-10px" }],
        },
    ]

    /** 🧩 获取奖品列表 */
    const queryRaffleAwardListHandle = async () => {
        try {
            const response = await queryRaffleAwardList(userId, activityId)
            const { code, info, data }: { code: string; info: string; data: RaffleAwardVO[] } =
                await response.json()

            if (code !== "0000") {
                alert(`获取奖品列表失败：${info}（code: ${code}）`)
                return
            }

            const newPrizes: Prize[] = data.map((award, index) => ({
                background: index % 2 === 0 ? "#e9e8fe" : "#b8c5f2",
                fonts: [{ id: award.awardId, text: award.awardTitle, top: "15px" }],
            }))

            setPrizes(newPrizes)
        } catch (err) {
            console.error("❌ 奖品列表请求失败：", err)
            alert("请求奖品列表时出现错误")
        }
    }

    /** 🎯 抽奖逻辑 */
    const randomRaffleHandle = async (): Promise<number | undefined> => {
        try {
            const response = await draw(userId, activityId)
            const {
                code,
                info,
                data,
            }: {
                code: string
                info: string
                data: { awardIndex?: number; awardId?: number | string }
            } = await response.json()

            if (code !== "0000") {
                alert(`抽奖失败：${info}（code: ${code}）`)
                return
            }

            // 返回奖品索引
            const prizeIndex =
                data.awardIndex ??
                prizes.findIndex((prize) =>
                    prize.fonts.some((font) => font.id === data.awardId)
                )

            return prizeIndex - 1
        } catch (err) {
            console.error("❌ 抽奖请求失败：", err)
            alert("请求抽奖接口时出现错误")
        }
    }

    /** 🔄 初始化奖品列表 */
    useEffect(() => {
        queryRaffleAwardListHandle()
    }, [userId, activityId])

    /** 🎡 渲染 */
    return (
        <div className="flex flex-col items-center mt-8">
            <LuckyWheel
                ref={myLucky}
                width="340px"
                height="340px"
                blocks={blocks}
                prizes={prizes}
                buttons={buttons}
                onStart={async () => {
                    if (isSpinning) return
                    setIsSpinning(true)

                    myLucky.current?.play()

                    const prizeIndex = await randomRaffleHandle()
                    if (prizeIndex !== undefined) {
                        setTimeout(() => {
                            myLucky.current?.stop(prizeIndex)
                        }, 2500)
                    } else {
                        setIsSpinning(false)
                    }
                }}
                onEnd={(prize: Prize) => {
                    const font = prize.fonts[0]
                    alert(`🎉 恭喜你抽到【${font.text}】（奖品ID：${font.id}）`)
                    setIsSpinning(false)
                }}
            />
        </div>
    )
}
