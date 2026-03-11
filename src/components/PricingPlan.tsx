"use client";

type PricingPlanProps = {
  features: string[];  // 确保 features 属性是一个数组类型，可以根据需求修改类型
};

export default function PricingPlan({ features }: PricingPlanProps) {
  return (
    <div>
      <h2>Features:</h2>
      <ul>
        {features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}