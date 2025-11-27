
export const RESOURCES = {
  en: {
    app: {
      title: "Paxos Interactive Simulator",
      subtitle: "Interactive Distributed Consensus with Network Simulation",
      reset: "Reset Simulation",
      nextAction: "Control Panel",
      selectScenario: "Select Scenario",
      logsTitle: "Network & System Logs",
      logsReady: "Network idle...",
      status: {
        idle: "Waiting for Input",
        preparing: "Broadcasting Prepare...",
        promising: "Waiting for Promises...",
        proposing: "Broadcasting Accept...",
        accepting: "Waiting for Consensus...",
        success: "Consensus Reached",
        failed: "Consensus Failed"
      }
    },
    roles: {
      Client: "Client",
      Proposer: "Proposer",
      Acceptor: "Acceptor",
      Learner: "Learner"
    },
    node: {
      minP: "MinP",
      accP: "AccP",
      val: "Val"
    },
    scenarios: {
      BASIC: {
        title: "Basic Consensus",
        desc: "Standard flow. Proposer 1 communicates with all Acceptors."
      },
      DUELING: {
        title: "Dueling Proposers (Step-by-Step)",
        desc: "Manually trigger a conflict where P1 and P2 fight for Acceptors."
      },
      DISCOVERY: {
        title: "Value Discovery",
        desc: "Safety: P2 must discover the value 'Golden Ticket' from the Acceptors."
      }
    },
    controls: {
      enterValue: "Client Input (Value):",
      enterProposal: "Proposal ID (N):",
      sendPrepare: "Broadcast Prepare",
      sendPrepareSubset: "Send to {targets}",
      sendAccept: "Broadcast Accept Request",
      retry: "Retry with Higher N",
      p1Control: "Proposer 1 (P1)",
      p2Control: "Proposer 2 (P2)",
    },
    messages: {
      startScenario: "Starting: {scenario}",
      clientReq: "Client requests: \"{val}\"",
      p1Start: "Proposer 1 is ready.",
      p2Start: "Proposer 2 is ready.",
      msgSent: "Node {from} -> {to}: {type}(n={n}) [Delay: {delay}ms]",
      msgArrived: "Node {to} received {type} from {from}.",
      promiseGranted: "Acceptor {id} Promished n={n}.",
      promiseRejected: "Acceptor {id} REJECTED n={n} (Seen {min}).",
      quorumReached: "P{pid} Reached Quorum! MaxVal: {val}",
      quorumWaiting: "P{pid} Waiting for Quorum ({count}/3)...",
      acceptBroadcasting: "Quorum met. Broadcasting ACCEPT(n={n}, v={val}).",
      accepted: "Acceptor {id} ACCEPTED proposal.",
      consensus: "LEARNER: Consensus reached on value \"{val}\"!",
      discoveryForce: "Constraint: Must propose \"{val}\" (Seen in Quorum).",
      discoveryFree: "No previous value. Proposing \"{val}\".",
      errorProposalLow: "Proposal ID {n} is too low.",
      errorProposalEqual: "Proposal ID {n} must be > current.",
      p1Preempted: "P{pid} failed to get Quorum. Retry with higher N.",
    }
  },
  zh: {
    app: {
      title: "Paxos 交互式模拟器",
      subtitle: "带网络信道模拟的分布式共识演示",
      reset: "重置模拟",
      nextAction: "控制面板",
      selectScenario: "选择场景",
      logsTitle: "网络与系统日志",
      logsReady: "网络空闲...",
      status: {
        idle: "等待输入",
        preparing: "正在广播 Prepare...",
        promising: "等待承诺 (Promises)...",
        proposing: "正在广播 Accept...",
        accepting: "等待共识...",
        success: "达成共识",
        failed: "共识失败"
      }
    },
    roles: {
      Client: "客户端",
      Proposer: "提议者",
      Acceptor: "接受者",
      Learner: "学习者"
    },
    node: {
      minP: "承诺",
      accP: "接受",
      val: "值"
    },
    scenarios: {
      BASIC: {
        title: "基础共识",
        desc: "标准流程。提议者 1 与所有接受者通信。"
      },
      DUELING: {
        title: "提议者竞争 (分步演示)",
        desc: "手动触发冲突：P1 和 P2 争抢接受者，导致 P1 失败并重试。"
      },
      DISCOVERY: {
        title: "价值发现 (Safety)",
        desc: "安全性：P2 必须从接受者那里“发现”并采纳 'Golden Ticket'。"
      }
    },
    controls: {
      enterValue: "客户端输入 (值):",
      enterProposal: "提案编号 (N):",
      sendPrepare: "广播 Prepare",
      sendPrepareSubset: "发送给 {targets}",
      sendAccept: "广播 Accept 请求",
      retry: "使用更大的 N 重试",
      p1Control: "提议者 1 (P1)",
      p2Control: "提议者 2 (P2)",
    },
    messages: {
      startScenario: "开始场景: {scenario}",
      clientReq: "客户端请求: \"{val}\"",
      p1Start: "提议者 1 就绪。",
      p2Start: "提议者 2 就绪。",
      msgSent: "节点 {from} -> {to}: {type}(n={n}) [延迟: {delay}ms]",
      msgArrived: "节点 {to} 收到 {type} (来自 {from})。",
      promiseGranted: "接受者 {id} 承诺 Promise(n={n})。",
      promiseRejected: "接受者 {id} 拒绝 Rejected(n={n}) (已承诺 {min})。",
      quorumReached: "P{pid} 达到 Quorum！最大值: {val}",
      quorumWaiting: "P{pid} 等待 Quorum ({count}/3)...",
      acceptBroadcasting: "Quorum 满足。广播 ACCEPT(n={n}, v={val})。",
      accepted: "接受者 {id} 接受 (ACCEPTED) 提案。",
      consensus: "学习者: 对值 \"{val}\" 达成共识！",
      discoveryForce: "约束: 必须提议 \"{val}\" (Quorum 中发现)。",
      discoveryFree: "未发现旧值。提议 \"{val}\"。",
      errorProposalLow: "提案编号 {n} 太低。",
      errorProposalEqual: "提案编号 {n} 必须大于之前的尝试。",
      p1Preempted: "P{pid} 未能达到 Quorum。请使用更大的 N 重试。",
    }
  }
};
