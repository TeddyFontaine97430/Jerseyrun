import UserNotifications
import FirebaseMessaging

/// Module qui s'exécute juste avant l'affichage d'une notification : Firebase y
/// télécharge l'image jointe (champ "Image" de /admin/notifications) et l'attache
/// à la notification. Sans lui, iOS affiche seulement le titre et le texte.
class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

        guard let bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        Messaging.serviceExtension().populateNotificationContent(
            bestAttemptContent,
            withContentHandler: contentHandler
        )
    }

    override func serviceExtensionTimeWillExpire() {
        // Temps écoulé (image trop lente à télécharger) : on affiche quand même le texte.
        if let contentHandler, let bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}
