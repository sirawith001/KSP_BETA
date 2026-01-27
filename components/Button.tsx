// app/components/Button.tsx
export default function MilitaryButton() {
  return (
    <div className="flex gap-4">
      <button className="btn-military">
        ปฏิบัติการ
      </button>
      
      <button className="btn-military-outline">
        ยกเลิก
      </button>
    </div>
  )
}