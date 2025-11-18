"use client"

import React, {useState, useRef, useEffect, use} from "react"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { LuckyGrid } from "@lucky-canvas/react"
import { queryRaffleAwardList, draw } from "@/apis"
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

function LuckyGridPage() {
    const searchParams = useSearchParams()
    const activityId = Number(searchParams.get("activityId"))
    const userId = String(searchParams.get("userId"))

    const myLucky = useRef<LuckyGridRef | null>(null)
    const [prizes, setPrizes] = useState<LuckyGridPrize[]>([])
    const [isSpinning, setIsSpinning] = useState(false)

    const blocks = [
        {
            padding: "5px",       // ← 加大！原来 14px 太小
            background: "#fff",    // 白底
        },
        {
            padding: "5px",       // ← 加大！原来 14px 太小
            background: "#fff",    // 白底

        },
    ]
    // 3. 按钮优化：改用百分比尺寸 + 文字 + 更好居中
    const buttons = [
        {x: 1, y: 1, background: "#ffffff", shadow:'3', imgs: [{src: "/raffle-button.png", width: "100px", height: "100px"}]}
    ]

    // 2. 关键修复：给每个格子加内边距！（这是官方隐藏属性，但超级有效）
    const defaultStyle = {
        background: "#b8c5f2",
        borderRadius: "12px",        // 每个格子圆角
        gutter: 10,                  // ← 神级属性！格子之间的间隔（单位 px）
        // 可选：加阴影让格子更立体
        shadow: "0 4px 10px rgba(0,0,0,0.15)",
    }

    /** 🧩 获取奖品列表并生成 8 宫格 */
    const queryRaffleAwardListHandle = async () => {
        if (!activityId || !userId) return
        try {
            const res = await queryRaffleAwardList(userId, activityId)
            const { code, info, data }: { code: string; info: string; data: RaffleAwardVO[] } = await res.json()

            if (code !== "0000") {
                alert(`获取抽奖列表失败：${info}（code: ${code}）`)
                return
            }

            // LuckyGrid 为 3x3，8 个奖品位置如下：
            const positionMap = [
                {x: 0, y: 0, background: "#ffffff", fonts: [{text: data[0].awardTitle, top: '80%', fontSize: '12px', fontWeight: '800'}], imgs: [{src: "/raffle-award-00.png", width: "100px", height: "100px", activeSrc: "/raffle-award.png"}]},
                {x: 1, y: 0, background: "#ffffff", fonts: [{text: data[1].awardTitle, top: '80%', fontSize: '12px', fontWeight: '800'}], imgs: [{src: "/raffle-award-01.png", width: "100px", height: "100px", activeSrc: "/raffle-award.png"}]},
                {x: 2, y: 0, background: "#ffffff", fonts: [{text: data[2].awardTitle, top: '80%', fontSize: '12px', fontWeight: '800'}], imgs: [{src: "/raffle-award-02.png", width: "100px", height: "100px", activeSrc: "/raffle-award.png"}]},
                {x: 2, y: 1, background: "#ffffff", fonts: [{text: data[3].awardTitle, top: '80%', fontSize: '12px', fontWeight: '800'}], imgs: [{src: "/raffle-award-12.png", width: "100px", height: "100px", activeSrc: "/raffle-award.png"}]},
                {
                    x: 2,
                    y: 2,
                    background: "#ffffff",
                    fonts: [{
                        text: data[4].isAwardUnlock ? data[4].awardTitle : '再抽奖' + data[4].waitUnlockCount + '次解锁',
                        top: '80%',
                        fontSize: '12px',
                        fontWeight: '800'
                    }],
                    imgs: [{
                        src: data[4].isAwardUnlock ? "/raffle-award-22.png" : "/raffle-award-22-lock.png",
                        width: "100px",
                        height: "100px",
                        activeSrc: "/raffle-award.png"
                    }]
                },
                {
                    x: 1,
                    y: 2,
                    background: "#ffffff",
                    fonts: [{
                        text: data[5].isAwardUnlock ? data[5].awardTitle : '再抽奖' + data[5].waitUnlockCount + '次解锁',
                        top: '80%',
                        fontSize: '12px',
                        fontWeight: '800'
                    }],
                    imgs: [{
                        src: data[5].isAwardUnlock ? "/raffle-award-21.png" : "/raffle-award-21-lock.png",
                        width: "100px",
                        height: "100px",
                        activeSrc: "/raffle-award.png"
                    }]
                },
                {
                    x: 0,
                    y: 2,
                    background: "#ffffff",
                    fonts: [{
                        text: data[6].isAwardUnlock ? data[6].awardTitle : '再抽奖' + data[6].waitUnlockCount + '次解锁',
                        top: '80%',
                        fontSize: '12px',
                        fontWeight: '800'
                    }],
                    imgs: [{
                        src: data[6].isAwardUnlock ? "/raffle-award-20.png" : "/raffle-award-20-lock.png",
                        width: "100px",
                        height: "100px",
                        activeSrc: "/raffle-award.png"
                    }]
                },
                {x: 0, y: 1, background: "#ffffff", fonts: [{text: data[7].awardTitle, top: '80%', fontSize: '12px', fontWeight: '800'}], imgs: [{src: "/raffle-award-10.png", width: "100px", height: "100px", activeSrc: "/raffle-award.png"}]},

            ]

            // const newPrizes: LuckyGridPrize[] = data.slice(0, 8).map((award, idx) => ({
            //     ...positionMap[idx],
            //     background: idx % 2 === 0 ? "#e9e8fe" : "#b8c5f2",
            //     fonts: [{ id: award.awardId, text: award.awardTitle, top: "50%", fontSize: "14px", lineHeight: "1.2", wordWrap: true,}],
            // }))

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            setPrizes(positionMap)
        } catch (err) {
            console.error("❌ 奖品列表请求失败：", err)
            alert("请求奖品列表时出现错误")
        }
    }

    /** 🎯 抽奖逻辑 */
    const randomRaffleHandle = async (): Promise<number | undefined> => {
        if (!activityId || !userId) return
        try {
            const res = await draw(userId, activityId)
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
    }, [userId, activityId])

    /** 🎡 渲染 LuckyGrid */
    return (
        <div className="flex flex-col items-center mt-8">
            <LuckyGrid
                ref={myLucky}
                width="340px"
                height="340px"
                rows={3}
                cols={3}
                prizes={prizes}
                // blocks={blocks}
                buttons={buttons}
                defaultStyle={defaultStyle}
                defaultConfig={{ gutter: 12 }} // 再保险一次
                activeStyle={{
                    background: "#ff8c8c",
                    shadow: "0 0 20px #ff6b6b",
                }}
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
                    // 加载数据
                    queryRaffleAwardListHandle().then(r => {
                    });
                    alert(`🎉 恭喜你抽到【${font.text}】`)
                    setIsSpinning(false)
                }}
            />
        </div>
    )
}

export default LuckyGridPage
