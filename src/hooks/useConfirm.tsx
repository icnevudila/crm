"use client"

import * as React from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmOptions {
    title?: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: "default" | "destructive"
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = React.createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const [options, setOptions] = React.useState<ConfirmOptions>({})
    const [resolver, setResolver] = React.useState<((value: boolean) => void) | null>(null)

    const confirm = React.useCallback((options: ConfirmOptions) => {
        setOptions(options)
        setOpen(true)
        return new Promise<boolean>((resolve) => {
            setResolver(() => resolve)
        })
    }, [])

    const handleConfirm = () => {
        setOpen(false)
        resolver?.(true)
    }

    const handleCancel = () => {
        setOpen(false)
        resolver?.(false)
    }

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options.title || "Emin misiniz?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {options.description || "Bu işlem geri alınamaz."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {options.cancelLabel || "İptal"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={options.variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
                        >
                            {options.confirmLabel || "Onayla"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    )
}

export function useConfirm() {
    const context = React.useContext(ConfirmContext)
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider")
    }
    return context
}
